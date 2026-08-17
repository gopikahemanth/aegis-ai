import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { BuildError } from "./build-error.js";
import type { HealingReport } from "./report.js";

import { Fixer } from "../agent/fixer.js";
import { PatchEngine } from "./patch-engine.js";
import type { AIProvider } from "../providers/base.js";
import { ContextEngine } from "../context/context-engine.js";
import { ErrorRootCauseMapper } from "./error-root-cause-mapper.js";
import { ErrorClassifier, FailureCategory } from "./error-classifier.js";
import { PathValidator } from "./path-validator.js";
import { TransactionalRepairSystem } from "./transactional-repair.js";
import { DynamicFileGraphManager } from "../governance/dynamic-file-graph.js";

export interface HealOptions {
  escalationLevel?: "fast" | "balanced" | "strong";
  attemptNumber?: number;
  taskId?: number | string;
  generationId?: string;
  verifyFn?: (projectPath: string) => Promise<{ success: boolean; stderr?: string }>;
}

export class SelfHealer {
  private readonly fixer: Fixer;
  private readonly patchEngine = new PatchEngine();
  private readonly context = new ContextEngine();
  private readonly rootCauseMapper = new ErrorRootCauseMapper();

  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  async heal(
    request: string,
    error: BuildError,
    projectPath: string,
    options: HealOptions | ("fast" | "balanced" | "strong") = "balanced",
  ): Promise<HealingReport> {
    const opts: HealOptions = typeof options === "string" ? { escalationLevel: options } : options;
    const escalationLevel = opts.escalationLevel || "balanced";
    const attemptNumber = opts.attemptNumber || 1;

    console.log(`\n[SelfHealer] 🩺 Analyzing build error (Attempt ${attemptNumber}, Level: ${escalationLevel})...`);
    console.log(`[SelfHealer] Summary: ${error.summary}`);

    // ── Step 1: Error Classification & Sanitize Failing Files ─────────────────
    const errorDetails = error.details || error.summary || "";
    const classification = ErrorClassifier.classify(errorDetails, { stage: "build" });
    console.log(`[SelfHealer] Classification: ${classification.category} (Confidence: ${(classification.confidence * 100).toFixed(0)}%)`);

    if (classification.isEnvironment) {
      console.warn(`[SelfHealer] ⚠️ Error is classified as ENVIRONMENT issue: ${classification.reason}`);
      console.warn(`[SelfHealer] Skipping AI code modification as code is not the root cause.`);
      return {
        attempts: 1,
        fixed: false,
        message: `ENVIRONMENT_ERROR: ${classification.reason}. Action: ${classification.suggestedAction}`,
      };
    }

    // Extract & sanitize failing paths using PathValidator to prevent rogue strings like "s"
    const rawFailingFiles = errorDetails.match(/(?:src|server|prisma|app)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|css|prisma|json)/g) || [];
    const priorityFiles = PathValidator.sanitizeCandidateFiles(rawFailingFiles, projectPath);
    const allProjectFiles = this.walkSourceFiles(projectPath);

    const rootCause = this.rootCauseMapper.analyze(errorDetails, allProjectFiles);
    console.log(`[RootCause] ${rootCause.summary}`);

    // Build structured repair hints
    const repairHints = rootCause.errors
      .map((e, i) => `Error ${i + 1} [${e.errorClass}] ${e.file}:${e.line}\n  → ${e.repairHint}`)
      .join("\n\n");

    // Files to modify: sanitized and validated
    const rawFilesToFix = [...new Set([...rootCause.filesToFix, ...priorityFiles])];
    const trueFilesToFix = PathValidator.sanitizeCandidateFiles(rawFilesToFix, projectPath);

    if (trueFilesToFix.length === 0) {
      // Fallback to top-level app files if no specific file could be resolved
      const defaultCandidates = ["src/App.tsx", "server/index.ts", "prisma/schema.prisma"];
      for (const cand of defaultCandidates) {
        if (existsSync(join(projectPath, cand))) {
          trueFilesToFix.push(cand);
        }
      }
    }

    console.log(`[SelfHealer] Validated files to target: [${trueFilesToFix.join(", ")}]`);

    // ── Step 2: Check for Repeated Repair Failures ───────────────────────────
    const repeatedCheck = TransactionalRepairSystem.checkRepeatedRepair(
      rootCause.summary,
      trueFilesToFix,
      errorDetails
    );

    if (repeatedCheck.isRepeated) {
      console.error(`[SelfHealer] 🛑 ${repeatedCheck.reason}`);
      return {
        attempts: attemptNumber,
        fixed: false,
        message: repeatedCheck.reason || "REPEATED_REPAIR_FAILURE",
      };
    }

    // ── Step 3: Create Atomic Repair Checkpoint ──────────────────────────────
    const checkpointId = TransactionalRepairSystem.createCheckpoint(projectPath, trueFilesToFix, {
      attemptNumber,
      taskId: opts.taskId,
      generationId: opts.generationId,
      failureType: classification.category,
      rootCause: rootCause.summary,
      strategy: `AI surgical fix (${escalationLevel})`,
      affectedFiles: trueFilesToFix,
    });


    // ── Step 4: Build Targeted Contract Context ──────────────────────────────
    const loadedFileGraph = DynamicFileGraphManager.load(projectPath);
    const projectContext = this.context.buildWithPriorityFiles(
      request,
      projectPath,
      trueFilesToFix,
    );

    // ── Step 5: Capture pre-repair line counts for Anti-Stub Guard ────────────
    const originalLineCounts = this.captureLineCounts(projectPath, trueFilesToFix);

    // ── Step 6: Call Fixer ───────────────────────────────────────────────────
    const primaryErrorClass = rootCause.errors[0]?.errorClass ?? "generic-ts-error";
    console.log(`[SelfHealer] Calling Fixer (tier: ${escalationLevel}, primary error: ${primaryErrorClass})...`);

    let response: string;
    try {
      response = await this.fixer.fix(
        request,
        errorDetails,
        projectContext,
        repairHints,
        escalationLevel,
        primaryErrorClass,
      );
    } catch (llmErr: any) {
      console.error(`[SelfHealer] LLM call failed during healing: ${llmErr.message}`);
      TransactionalRepairSystem.rollback(projectPath, checkpointId, `LLM invocation failure: ${llmErr.message}`);
      return {
        attempts: attemptNumber,
        fixed: false,
        message: `Healer LLM call failed: ${llmErr.message}`,
      };
    }

    // ── Step 7: Apply patch via PatchEngine ──────────────────────────────────
    let filesPatched = 0;
    try {
      filesPatched = this.patchEngine.apply(response, projectPath);
      console.log(`[SelfHealer] Patched ${filesPatched} file(s).`);
    } catch (patchErr: any) {
      console.error(`[SelfHealer] PatchEngine application error: ${patchErr.message}`);
      TransactionalRepairSystem.rollback(projectPath, checkpointId, `Patch application error: ${patchErr.message}`);
      return {
        attempts: attemptNumber,
        fixed: false,
        message: `Patch application failed: ${patchErr.message}`,
      };
    }

    if (filesPatched === 0) {
      console.warn(`[SelfHealer] ⚠️ Fixer returned 0 valid patches.`);
      TransactionalRepairSystem.rollback(projectPath, checkpointId, "Zero valid files patched");
      return {
        attempts: attemptNumber,
        fixed: false,
        message: "Fixer produced no valid file changes",
      };
    }

    // ── Step 8: Post-Patch Validation (Anti-Stub Guard & Targeted Verify) ────
    const stubsDetected = this.detectStubs(projectPath, trueFilesToFix, originalLineCounts);
    if (stubsDetected.length > 0) {
      console.warn(`[AntiStub] ⚠️ Repair agent replaced file(s) with stubs — rolling back.`);
      TransactionalRepairSystem.rollback(projectPath, checkpointId, `AntiStub violation in: ${stubsDetected.join(", ")}`);
      return {
        attempts: attemptNumber,
        fixed: false,
        message: `REJECTED: AntiStub guard detected file shrinkage in ${stubsDetected.join(", ")}`,
      };
    }

    // Run verification function if supplied
    if (opts.verifyFn) {
      console.log(`[SelfHealer] 🔬 Running targeted verification...`);
      try {
        const verifyResult = await opts.verifyFn(projectPath);
        if (!verifyResult.success) {
          console.warn(`[SelfHealer] ❌ Post-repair verification failed: ${verifyResult.stderr}`);
          TransactionalRepairSystem.rollback(projectPath, checkpointId, `Post-repair verification failed: ${verifyResult.stderr || "build error"}`);
          return {
            attempts: attemptNumber,
            fixed: false,
            message: `Repair failed post-verification: ${verifyResult.stderr}`,
          };
        }
      } catch (vErr: any) {
        TransactionalRepairSystem.rollback(projectPath, checkpointId, `Verification throw: ${vErr.message}`);
        return {
          attempts: attemptNumber,
          fixed: false,
          message: `Verification exception: ${vErr.message}`,
        };
      }
    }

    // ── Step 9: Commit Checkpoint on Success ─────────────────────────────────
    TransactionalRepairSystem.commit(checkpointId);
    console.log(`[SelfHealer] 🎉 Repair committed successfully (${filesPatched} file(s)).`);


    return {
      attempts: attemptNumber,
      fixed: true,
      message: `Successfully repaired ${filesPatched} file(s). Root cause: ${rootCause.summary}`,
    };
  }

  /** Capture line counts of relevant files before patching */
  private captureLineCounts(projectPath: string, files: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const f of files) {
      const candidates = [
        join(projectPath, f),
        join(projectPath, "src", f),
      ];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          try {
            const lines = readFileSync(candidate, "utf8").split("\n").length;
            counts.set(f, lines);
          } catch {}
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
      const candidates = [join(projectPath, file), join(projectPath, "src", file)];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          try {
            const newLines = readFileSync(candidate, "utf8").split("\n").length;
            if (newLines < originalLines * 0.25) {
              stubs.push(file);
            }
          } catch {}
          break;
        }
      }
    }
    return stubs;
  }

  /** Walk src/ and server/ for all .ts/.tsx files */
  private walkSourceFiles(projectPath: string): string[] {
    const results: string[] = [];
    const scan = (dir: string) => {
      if (!existsSync(dir)) return;
      try {
        for (const entry of readdirSync(dir)) {
          if (["node_modules", ".git", "dist", ".aegis"].includes(entry)) continue;
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) scan(full);
          else if (full.endsWith(".ts") || full.endsWith(".tsx")) results.push(full);
        }
      } catch {}
    };
    scan(join(projectPath, "src"));
    scan(join(projectPath, "server"));
    return results;
  }
}
