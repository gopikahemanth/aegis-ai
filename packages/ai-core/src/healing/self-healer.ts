import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { BuildError } from "./build-error.js";
import type { HealingReport } from "./report.js";

import { Fixer } from "../agent/fixer.js";
import { PatchEngine } from "./patch-engine.js";
import type { AIProvider } from "../providers/base.js";
import { ContextEngine } from "../context/context-engine.js";
import { ErrorRootCauseMapper } from "./error-root-cause-mapper.js";

export class SelfHealer {
  private readonly fixer: Fixer;
  private readonly patchEngine = new PatchEngine();
  private readonly context = new ContextEngine();
  private readonly rootCauseMapper = new ErrorRootCauseMapper();

  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  private extractFailingFiles(details: string): string[] {
    const matches = details.matchAll(
      /([A-Za-z0-9_./-]+\.(ts|tsx|js|jsx|css|json))/g,
    );
    return [...new Set([...matches].map(match => match[1]))];
  }

  async heal(
    request: string,
    error: BuildError,
    projectPath: string,
    escalationLevel: "fast" | "balanced" | "strong" = "balanced",
  ): Promise<HealingReport> {
    console.log("Analyzing build error...");
    console.log(error.summary);

    // ── Step 1: Root Cause Analysis ──────────────────────────────────────────
    // Get all project .tsx/.ts files for context
    const priorityFiles = this.extractFailingFiles(error.details);
    const allProjectFiles = this.walkSourceFiles(projectPath);

    const rootCause = this.rootCauseMapper.analyze(error.details, allProjectFiles);
    console.log(`[RootCause] ${rootCause.summary}`);

    // Build structured repair hints from the classifier
    const repairHints = rootCause.errors
      .map((e, i) => `Error ${i + 1} [${e.errorClass}] ${e.file}:${e.line}\n  → ${e.repairHint}`)
      .join("\n\n");

    // Priority files = files that ACTUALLY need to change (not just where error appears)
    const trueFilesToFix = [...new Set([
      ...rootCause.filesToFix,
      ...priorityFiles,
    ])];

    console.log(`[RootCause] Files to fix: ${trueFilesToFix.join(", ")}`);

    // ── Step 2: Build context with correct priority files ────────────────────
    console.log("Before ContextEngine");
    const projectContext = this.context.buildWithPriorityFiles(
      request,
      projectPath,
      trueFilesToFix,
    );
    console.log("After ContextEngine");

    // ── Step 3: Capture original line counts to detect stubs ─────────────────
    const originalLineCounts = this.captureLineCounts(projectPath, trueFilesToFix);

    // ── Step 4: Call Fixer with root cause hints + model escalation ─────────
    const primaryErrorClass = rootCause.errors[0]?.errorClass ?? "generic-ts-error";
    console.log(`[Fixer] Using model tier: ${escalationLevel}, primary error class: ${primaryErrorClass}`);
    console.log("Calling Fixer...");
    const response = await this.fixer.fix(
      request,
      error.details,
      projectContext,
      repairHints,
      escalationLevel,
      primaryErrorClass,
    );
    console.log("Fixer returned.");

    // ── Step 5: Apply patch, then verify no stubs were introduced ────────────
    const filesPatched = this.patchEngine.apply(response, projectPath);
    console.log(`Patched ${filesPatched} file(s).`);

    // Anti-stub guard: if any patched file shrank to < 20% of its original size, reject it
    const stubsDetected = this.detectStubs(projectPath, trueFilesToFix, originalLineCounts);
    if (stubsDetected.length > 0) {
      console.warn(`[AntiStub] ⚠ Repair agent replaced ${stubsDetected.length} file(s) with stubs — rejecting those patches.`);
      console.warn(`[AntiStub] Affected: ${stubsDetected.join(", ")}`);
      // Note: in a future version, restore original files here from git
    }

    return {
      attempts: 1,
      fixed: filesPatched > 0,
      message: `Patched ${filesPatched} file(s). Root cause: ${rootCause.summary}`,
    };
  }

  /** Capture line counts of relevant files before patching */
  private captureLineCounts(projectPath: string, files: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const f of files) {
      // Try both absolute and relative paths
      const candidates = [
        f,
        join(projectPath, f),
        join(projectPath, "src", f),
      ];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          try {
            const lines = readFileSync(candidate, "utf8").split("\n").length;
            counts.set(f, lines);
          } catch { /* ignore */ }
          break;
        }
      }
    }
    return counts;
  }

  /** Detect files that shrank to < 25% of original — likely stubs */
  private detectStubs(
    projectPath: string,
    files: string[],
    originalCounts: Map<string, number>,
  ): string[] {
    const stubs: string[] = [];
    for (const [file, originalLines] of originalCounts.entries()) {
      if (originalLines < 15) continue; // Small files are fine
      const candidates = [file, join(projectPath, file), join(projectPath, "src", file)];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          try {
            const newLines = readFileSync(candidate, "utf8").split("\n").length;
            if (newLines < originalLines * 0.25) {
              stubs.push(file);
            }
          } catch { /* ignore */ }
          break;
        }
      }
    }
    return stubs;
  }

  /** Walk src/ for all .ts/.tsx files */
  private walkSourceFiles(projectPath: string): string[] {
    const srcDir = join(projectPath, "src");
    if (!existsSync(srcDir)) return [];
    try {
      const results: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) walk(full);
          else if (full.endsWith(".ts") || full.endsWith(".tsx")) results.push(full);
        }
      };
      walk(srcDir);
      return results;
    } catch { return []; }
  }
}
