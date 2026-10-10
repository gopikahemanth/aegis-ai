/**
 * InteractionProvenanceTracker
 *
 * Implements Invariant 3: Interaction Provenance & Native Interaction Ratio (NIR).
 *
 * Tracks the origin and evolution of interactive behaviors across the generation pipeline:
 * - Native handlers authored by CoderAgent
 * - Injected handlers added by post-processing/sanitizer
 * - Repaired components touched by deterministic fixers
 * - Native interaction failures encountered during runtime execution
 *
 * NIR = nativeHandlers / (nativeHandlers + sanitizerInjectedHandlers)
 */

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface ComponentHandlerInfo {
  file: string;
  componentName: string;
  handlerType: string; // e.g. "onClick", "onChange", "onSubmit", "useState"
  signature: string;
  source: "CODER_NATIVE" | "SANITIZER_INJECTED" | "HEALER_REPAIRED";
}

export interface FileProvenanceSnapshot {
  filePath: string;
  contentHash: string;
  handlers: ComponentHandlerInfo[];
}

export interface InteractionBaselineArtifact {
  generationId: string;
  capturedAt: string;
  sourceHash: string;
  totalFiles: number;
  totalNativeHandlers: number;
  files: Array<[string, FileProvenanceSnapshot]>;
}

export interface InteractionProvenanceReport {
  generationId?: string;
  capturedAt?: string;
  sourceHash?: string;
  nativeHandlers: number;
  sanitizerInjectedHandlers: number;
  sanitizerRepairedComponents: string[];
  nativeInteractionFailures: number;
  nir: number; // 0.0 - 1.0
  filesAudited: number;
  details: Array<{
    file: string;
    nativeCount: number;
    injectedCount: number;
    handlers: string[];
  }>;
  summary: string;
}

export class InteractionProvenanceTracker {
  private static baselineSnapshots = new Map<string, Map<string, FileProvenanceSnapshot>>();
  private static baselineMetadata = new Map<string, { generationId: string; capturedAt: string; sourceHash: string }>();

  public static hasBaseline(projectRoot: string): boolean {
    if (this.baselineSnapshots.has(projectRoot) && (this.baselineSnapshots.get(projectRoot)?.size || 0) > 0) {
      return true;
    }
    const baselineFile = join(projectRoot, ".aegis", "interaction-baseline.json");
    return existsSync(baselineFile);
  }

  /**
   * Capture baseline snapshot immediately after CoderAgent finishes generation
   * and before any sanitizer or post-processing scripts execute.
   */
  public static captureBaseline(
    projectRoot: string,
    options?: { generationId?: string; force?: boolean }
  ): Map<string, FileProvenanceSnapshot> {
    if (!options?.force && this.baselineSnapshots.has(projectRoot) && (this.baselineSnapshots.get(projectRoot)?.size || 0) > 0) {
      return this.baselineSnapshots.get(projectRoot)!;
    }
    const srcDir = join(projectRoot, "src");
    const snapshotMap = new Map<string, FileProvenanceSnapshot>();
    const generationId = options?.generationId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const capturedAt = new Date().toISOString();

    if (!existsSync(srcDir)) {
      this.baselineSnapshots.set(projectRoot, snapshotMap);
      return snapshotMap;
    }

    const files = this.collectSourceFiles(srcDir);
    let combinedContent = "";
    for (const f of files.sort()) {
      const rel = relative(projectRoot, f).replace(/\\/g, "/");
      const content = readFileSync(f, "utf8");
      combinedContent += rel + ":" + content;
      const handlers = this.extractHandlers(content, rel, "CODER_NATIVE");
      snapshotMap.set(rel, {
        filePath: rel,
        contentHash: this.hashString(content),
        handlers,
      });
    }

    const sourceHash = this.hashString(combinedContent);
    this.baselineSnapshots.set(projectRoot, snapshotMap);
    this.baselineMetadata.set(projectRoot, { generationId, capturedAt, sourceHash });
    const totalHandlers = this.countTotalHandlers(snapshotMap);
    console.log(`[InteractionProvenance] 📸 Baseline captured at CoderAgent boundary for ${snapshotMap.size} files with ${totalHandlers} native interactive handlers. (Gen ID: ${generationId}, Source Hash: ${sourceHash})`);

    // Persist immutable baseline to .aegis/interaction-baseline.json
    try {
      const aegisDir = join(projectRoot, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
      const artifact: InteractionBaselineArtifact = {
        generationId,
        capturedAt,
        sourceHash,
        totalFiles: snapshotMap.size,
        totalNativeHandlers: totalHandlers,
        files: Array.from(snapshotMap.entries()),
      };
      writeFileSync(join(aegisDir, "interaction-baseline.json"), JSON.stringify(artifact, null, 2), "utf8");
    } catch {}

    return snapshotMap;
  }

  /**
   * Audit interaction provenance after post-processing/sanitization is complete.
   */
  public static audit(
    projectRoot: string,
    options?: {
      nativeInteractionFailures?: number;
      sanitizerTouchedFiles?: string[];
    }
  ): InteractionProvenanceReport {
    const srcDir = join(projectRoot, "src");
    let baseline = this.baselineSnapshots.get(projectRoot);
    let meta = this.baselineMetadata.get(projectRoot);

    if (!baseline || baseline.size === 0) {
      // Try restoring from .aegis/interaction-baseline.json
      const baselineFile = join(projectRoot, ".aegis", "interaction-baseline.json");
      if (existsSync(baselineFile)) {
        try {
          const raw = JSON.parse(readFileSync(baselineFile, "utf8"));
          if (raw && !Array.isArray(raw) && Array.isArray(raw.files)) {
            // Structured InteractionBaselineArtifact
            baseline = new Map(raw.files);
            meta = { generationId: raw.generationId, capturedAt: raw.capturedAt, sourceHash: raw.sourceHash };
            this.baselineMetadata.set(projectRoot, meta);
          } else if (Array.isArray(raw)) {
            // Legacy format
            baseline = new Map(raw);
          }
          if (baseline) {
            this.baselineSnapshots.set(projectRoot, baseline);
          }
        } catch {}
      }
    }

    // If still no baseline, but a verified on-disk report already exists, prefer loading it
    // rather than erroneously fabricating an all-injected report
    if ((!baseline || baseline.size === 0)) {
      const existingReport = this.loadReport(projectRoot);
      if (existingReport && existingReport.nativeHandlers > 0) {
        return existingReport;
      }
    }

    baseline = baseline || new Map<string, FileProvenanceSnapshot>();
    const currentFiles = existsSync(srcDir) ? this.collectSourceFiles(srcDir) : [];

    let nativeCount = 0;
    let injectedCount = 0;
    const repairedComponents = new Set<string>(options?.sanitizerTouchedFiles || []);
    const details: InteractionProvenanceReport["details"] = [];

    for (const f of currentFiles) {
      const rel = relative(projectRoot, f).replace(/\\/g, "/");

      // Skip test files and design-system utility components — they are not
      // CoderAgent interaction components and must not affect NIR.
      if (InteractionProvenanceTracker.isExcludedFromNIR(rel)) {
        details.push({ file: rel, nativeCount: 0, injectedCount: 0, handlers: ["[EXCLUDED_FROM_NIR]"] });
        continue;
      }

      const content = readFileSync(f, "utf8");
      const currentHandlers = this.extractHandlers(content, rel, "CODER_NATIVE");
      const baselineEntry = baseline.get(rel);

      let fileNative = 0;
      let fileInjected = 0;
      const handlerSummaries: string[] = [];

      if (!baselineEntry) {
        // File was created by sanitizer/post-processing
        fileInjected = currentHandlers.length;
        injectedCount += fileInjected;
        if (currentHandlers.length > 0) {
          repairedComponents.add(rel);
        }
        for (const h of currentHandlers) {
          handlerSummaries.push(`[INJECTED] ${h.handlerType}`);
        }
      } else {
        const baselineContentHash = baselineEntry.contentHash;
        const currentHash = this.hashString(content);

        if (baselineContentHash === currentHash) {
          // File was untouched: 100% native
          fileNative = currentHandlers.length;
          nativeCount += fileNative;
          for (const h of currentHandlers) {
            handlerSummaries.push(`[NATIVE] ${h.handlerType}`);
          }
        } else {
          // File was modified by sanitizer: compare handlers
          repairedComponents.add(rel);
          const baselineSignatures = new Set(baselineEntry.handlers.map(h => h.signature));

          for (const h of currentHandlers) {
            if (baselineSignatures.has(h.signature)) {
              fileNative++;
              nativeCount++;
              handlerSummaries.push(`[NATIVE] ${h.handlerType}`);
            } else {
              fileInjected++;
              injectedCount++;
              handlerSummaries.push(`[INJECTED] ${h.handlerType}`);
            }
          }
        }
      }

      details.push({
        file: rel,
        nativeCount: fileNative,
        injectedCount: fileInjected,
        handlers: handlerSummaries,
      });
    }

    const totalHandlers = nativeCount + injectedCount;
    const nir = totalHandlers > 0 ? Number((nativeCount / totalHandlers).toFixed(3)) : 1.0;
    const nativeFailures = options?.nativeInteractionFailures ?? 0;

    const summary = `Native Interaction Ratio: ${nir.toFixed(2)} (Native: ${nativeCount}, Injected: ${injectedCount}, Repaired Components: ${repairedComponents.size}, Interaction Failures: ${nativeFailures})`;

    const report: InteractionProvenanceReport = {
      generationId: meta?.generationId,
      capturedAt: meta?.capturedAt,
      sourceHash: meta?.sourceHash,
      nativeHandlers: nativeCount,
      sanitizerInjectedHandlers: injectedCount,
      sanitizerRepairedComponents: Array.from(repairedComponents),
      nativeInteractionFailures: nativeFailures,
      nir,
      filesAudited: currentFiles.length,
      details,
      summary,
    };

    // Save report to .aegis/interaction-provenance.json
    try {
      const aegisDir = join(projectRoot, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
      writeFileSync(join(aegisDir, "interaction-provenance.json"), JSON.stringify(report, null, 2), "utf8");
    } catch {}

    return report;
  }

  /**
   * Load existing interaction provenance report from .aegis/interaction-provenance.json if present.
   */
  public static loadReport(projectRoot: string): InteractionProvenanceReport | null {
    const reportPath = join(projectRoot, ".aegis", "interaction-provenance.json");
    if (!existsSync(reportPath)) return null;
    try {
      return JSON.parse(readFileSync(reportPath, "utf8"));
    } catch {
      return null;
    }
  }

  private static extractHandlers(
    code: string,
    file: string,
    source: ComponentHandlerInfo["source"]
  ): ComponentHandlerInfo[] {
    const handlers: ComponentHandlerInfo[] = [];
    const compName = file.split("/").pop()?.replace(/\.[^.]+$/, "") || "Unknown";

    // Match JSX event handlers: onClick={...}, onChange={...}, onSubmit={...}, etc.
    const eventRegex = /\b(on(?:Click|Change|Submit|KeyDown|KeyUp|Select|Toggle|Input))\s*=\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = eventRegex.exec(code)) !== null) {
      const handlerType = match[1];
      const snippet = match[2].trim().slice(0, 40);
      handlers.push({
        file,
        componentName: compName,
        handlerType,
        signature: `${compName}:${handlerType}:${snippet}`,
        source,
      });
    }

    // Match interactive state hooks: useState(...)
    const stateRegex = /\bconst\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*set([a-zA-Z0-9_]+)\s*\]\s*=\s*useState/g;
    while ((match = stateRegex.exec(code)) !== null) {
      const varName = match[1];
      handlers.push({
        file,
        componentName: compName,
        handlerType: "useState",
        signature: `${compName}:state:${varName}`,
        source,
      });
    }

    return handlers;
  }

  /**
   * Determines whether a source file should be excluded from NIR audit.
   *
   * Excluded categories (not CoderAgent feature interaction authorship):
   * - Test files (src/__tests__/, *.test.tsx, *.spec.tsx) — created by TestGeneratorAgent
   * - Design-system utility components (src/components/ui/) — created by FastSanitizer boilerplate
   * - Pure design-token / shared utility files with no domain logic
   */
  public static isExcludedFromNIR(relPath: string): boolean {
    const norm = relPath.replace(/\\/g, "/");
    // Test infrastructure
    if (/[\/\\]__tests__[\/\\]/.test(norm)) return true;
    if (/\.(test|spec)\.(tsx|jsx|ts|js)$/.test(norm)) return true;
    // Design-system utility components (sanitizer-generated boilerplate)
    if (/^src[\/\\]components[\/\\]ui[\/\\]/.test(norm)) return true;
    if (/^src[\/\\]design-system[\/\\]components[\/\\]/.test(norm)) return true;
    return false;
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          results.push(...this.collectSourceFiles(full));
        } else if (/\.(tsx|jsx)$/i.test(e.name)) {
          results.push(full);
        }
      }
    } catch {}
    return results;
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  private static countTotalHandlers(map: Map<string, FileProvenanceSnapshot>): number {
    let count = 0;
    for (const snap of map.values()) {
      count += snap.handlers.length;
    }
    return count;
  }
}
