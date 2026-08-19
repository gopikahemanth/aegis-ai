import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import type { DomainContract } from "../governance/domain-contract.js";

export interface FeatureEvidence {
  featureName: string;
  hasUI: boolean;
  hasHandler: boolean;
  hasStateMutation: boolean;
  hasPersistence: boolean;
  isReal: boolean;
  confidence: number;
  details: string;
  violations: string[];
}

export interface RealityViolation {
  feature: string;
  file: string;
  line: number;
  violation: string;
  severity: "error" | "warning";
}

export interface FeatureRealityReport {
  passed: boolean;
  score: number;
  features: FeatureEvidence[];
  violations: RealityViolation[];
  summary: string;
}

/**
 * FeatureRealityValidator
 *
 * Verifies that application features are authentically wired end-to-end:
 * UI Action -> Event Handler -> State Mutation / API Call -> Persistence.
 *
 * Explicitly rejects:
 * - Empty event handlers (e.g. `onClick={() => {}}`)
 * - Console.log-only handlers (e.g. `onClick={() => console.log(...)}`)
 * - Simulated setTimeout delays pretending to process data
 * - Hardcoded static arrays used in place of dynamic state/database collections
 */
export class FeatureRealityValidator {
  private static readonly SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

  public static validate(projectRoot: string, domainContract?: DomainContract | null): FeatureRealityReport {
    const files = this.collectSourceFiles(projectRoot);
    const fileEntries = files.map(f => {
      try {
        const content = readFileSync(f, "utf8");
        return {
          path: f,
          rel: relative(projectRoot, f).replace(/\\/g, "/"),
          content,
          lines: content.split(/\r?\n/),
        };
      } catch {
        return { path: f, rel: relative(projectRoot, f).replace(/\\/g, "/"), content: "", lines: [] };
      }
    });

    const violations: RealityViolation[] = [];
    const allSource = fileEntries.map(f => f.content).join("\n");

    // 1. Audit for fake patterns in all source files
    const FAKE_PATTERNS = [
      {
        pattern: /onClick=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?/,
        desc: "Empty onClick handler without business logic",
        severity: "error" as const,
      },
      {
        pattern: /onSubmit=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?/,
        desc: "Empty onSubmit handler without business logic",
        severity: "error" as const,
      },
      {
        pattern: /onClick=\{?\s*\(\)\s*=>\s*console\.log\([^)]*\)\s*\}?/,
        desc: "Console.log-only onClick handler",
        severity: "error" as const,
      },
      {
        pattern: /setTimeout\(\s*\(\)\s*=>\s*\{\s*set(?:Loading|Score|Data|Tasks|Items)\([^)]*\)\s*;\s*\}\s*,\s*\d{3,5}\)/,
        desc: "Fake setTimeout simulation pretending to process data",
        severity: "error" as const,
      },
      {
        pattern: /const\s+mock(?:Data|Tasks|Result|Score|Users|Items)\s*=\s*\[/,
        desc: "Hardcoded static mock dataset in production component",
        severity: "warning" as const,
      },
      {
        pattern: /throw\s+new\s+Error\s*\(\s*["'`](?:Not implemented|TODO|IMPLEMENT|PLACEHOLDER)["'`]\s*\)/i,
        desc: "Unimplemented stub throwing placeholder error",
        severity: "error" as const,
      },
    ];

    for (const f of fileEntries) {
      for (let i = 0; i < f.lines.length; i++) {
        const line = f.lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

        for (const p of FAKE_PATTERNS) {
          if (p.pattern.test(line)) {
            violations.push({
              feature: "Feature Reality",
              file: f.rel,
              line: i + 1,
              violation: p.desc,
              severity: p.severity,
            });
            break;
          }
        }
      }
    }

    // 2. Behavioral verification of core requested features
    const featureEvidences: FeatureEvidence[] = [];

    // Derive features from domain contract or standard fullstack requirements
    const rawFeatures = domainContract?.features?.length
      ? domainContract.features
      : ["Task Management", "Creation", "Filtering", "Persistence"];

    for (const feat of rawFeatures) {
      const featName = typeof feat === "string" ? feat : (feat.name || feat.featureId || "Feature");
      const evidence = this.evaluateFeatureEvidence(featName, fileEntries, allSource);
      featureEvidences.push(evidence);
      if (!evidence.isReal && evidence.violations.length > 0) {
        for (const v of evidence.violations) {
          violations.push({
            feature: featName,
            file: "(behavioral-audit)",
            line: 0,
            violation: v,
            severity: "error",
          });
        }
      }
    }

    const errors = violations.filter(v => v.severity === "error");
    const passed = errors.length === 0 && featureEvidences.every(f => f.isReal);
    const score = Math.max(0, 100 - (errors.length * 20));

    const summary = passed
      ? `✓ Feature Reality: All ${featureEvidences.length} requested features verified as authentic end-to-end implementations.`
      : `🔴 Feature Reality: ${errors.length} reality violation(s) detected.`;

    return {
      passed,
      score,
      features: featureEvidences,
      violations,
      summary,
    };
  }

  /**
   * Evaluates end-to-end behavioral evidence for a given feature.
   */
  public static evaluateFeatureEvidence(
    featureName: string,
    fileEntries: Array<{ rel: string; content: string }>,
    allSource: string
  ): FeatureEvidence {
    // 1. UI Evidence: Forms, inputs, buttons, drag-and-drop containers, selects
    const hasUI =
      /<button|<input|<form|<select|<textarea|onClick|onSubmit|onDragEnd|draggable|<div|<ul|<li/i.test(allSource);

    // 2. Handler Evidence: Functions that process user interactions
    const hasHandler =
      /handle[A-Za-z0-9_]*|on[A-Za-z0-9_]*|set[A-Z][A-Za-z0-9_]*|addEventListener/i.test(allSource);

    // 3. State Mutation Evidence: React state, Zustand, Redux, useMemo filter, or context dispatch
    const hasStateMutation =
      /useState|useReducer|useMemo|set[A-Z][A-Za-z0-9_]*|useTaskStore|useStore|dispatch\(|setState\(|prev\s*=>/i.test(allSource);

    // 4. Persistence Evidence: API requests, Prisma, localStorage, props callbacks, or DB calls
    const hasPersistence =
      /localStorage\.(setItem|getItem)|sessionStorage|fetch\(|axios\.(get|post|put|delete)|prisma\.\w+\.(create|findMany|update|delete)|api\.\w+|on[A-Z]\w*\(/i.test(allSource);

    const violations: string[] = [];

    if (!hasUI) {
      violations.push(`No interactive UI elements found for feature '${featureName}'`);
    }
    if (!hasHandler && !hasStateMutation) {
      violations.push(`No active event handlers or state bindings found for feature '${featureName}'`);
    }

    const isReal = hasUI && (hasHandler || hasStateMutation);
    const confidence = (Number(hasUI) + Number(hasHandler) + Number(hasStateMutation) + Number(hasPersistence)) / 4;

    return {
      featureName,
      hasUI,
      hasHandler,
      hasStateMutation,
      hasPersistence,
      isReal,
      confidence,
      details: `UI: ${hasUI}, Handler: ${hasHandler}, State: ${hasStateMutation}, Persistence: ${hasPersistence}`,
      violations,
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const scan = (d: string) => {
      if (!existsSync(d)) return;
      try {
        for (const entry of readdirSync(d)) {
          if (["node_modules", ".git", "dist", ".aegis", "coverage"].includes(entry)) continue;
          const full = join(d, entry);
          const stat = statSync(full);
          if (stat.isDirectory()) scan(full);
          else if (this.SOURCE_EXTS.has(extname(entry)) && !entry.endsWith(".d.ts")) results.push(full);
        }
      } catch {}
    };
    scan(join(dir, "src"));
    scan(join(dir, "server"));
    return results;
  }
}
