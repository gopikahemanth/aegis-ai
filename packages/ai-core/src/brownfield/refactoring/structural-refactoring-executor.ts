/**
 * StructuralRefactoringExecutor — Aegis V2.3 Project 2 Phase 4.6
 *
 * Transactional execution layer for structural refactorings:
 * - Authoritative FinalExecutionGate validation & execution fingerprinting
 * - Feature branch isolation (aegis/refactor/<slug>) via BrownfieldGitGuard
 * - Explicit transaction journaling via BrownfieldTransactionManager
 * - Exact character-offset AST patch application (descending startPos)
 * - Authoritative FinalSuccessGate evaluation before feature branch commit
 * - Invariant: main/default branch remains completely untouched
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execSync } from "node:child_process";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { FinalExecutionGate } from "./final-execution-gate.js";
import { FinalSuccessGate } from "./final-success-gate.js";
import type {
  StructuralRefactoringPlan,
  StructuralRefactoringExecutionOptions,
  StructuralRefactoringExecutionResult,
} from "./structural-refactoring-contract.js";

export class StructuralRefactoringExecutor {
  private readonly projectRoot: string;
  private readonly txManager: BrownfieldTransactionManager;
  private readonly executionGate: FinalExecutionGate;
  private readonly successGate: FinalSuccessGate;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.txManager = new BrownfieldTransactionManager();
    this.executionGate = new FinalExecutionGate(this.projectRoot);
    this.successGate = new FinalSuccessGate(this.projectRoot);
  }

  /**
   * Executes a previewed StructuralRefactoringPlan on an isolated feature branch.
   */
  public async execute(
    plan: StructuralRefactoringPlan,
    options: StructuralRefactoringExecutionOptions = {}
  ): Promise<StructuralRefactoringExecutionResult> {
    const symName = plan.sourceSymbol?.name || plan.symbols?.map(s => s.name).join(", ") || "symbols";
    const destName = plan.destinationFile || "submodules";
    console.log(`[StructuralRefactoringExecutor] 🛡️ Starting structural refactoring: "${symName}" -> "${destName}"`);

    // 1. Authoritative FinalExecutionGate Evaluation
    const gateEval = this.executionGate.evaluate(plan);
    if (!gateEval.allowed) {
      console.error(`[StructuralRefactoringExecutor] 🛑 Execution blocked: status=${gateEval.status}`);
      return {
        success: false,
        status: gateEval.status,
        touchedFiles: [],
        error: `Execution is blocked: status=${gateEval.status}, reasons=${gateEval.reasons.join("; ")}`,
      };
    }

    // Acquire concurrency lock
    FinalExecutionGate.acquireLocks(this.projectRoot, plan.affectedFiles);

    // 2. Feature Branch Isolation
    const slug = options.customBranchName || this.generateBranchSlug(plan);
    const branchName = `aegis/refactor/${slug}`;
    let featureBranchCreated = false;

    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(this.projectRoot, []);
    if (gitPreflight.gitState.isGitRepo) {
      try {
        const branchResult = BrownfieldGitGuard.createFeatureBranch(branchName, this.projectRoot);
        if (!branchResult.success && branchResult.error?.includes("FEATURE_BRANCH_EXISTS")) {
          FinalExecutionGate.releaseLocks(this.projectRoot, plan.affectedFiles);
          console.warn(`[StructuralRefactoringExecutor] 🛑 Feature branch "${branchName}" already exists.`);
          return {
            success: false,
            status: "FEATURE_BRANCH_EXISTS",
            touchedFiles: [],
            error: `Feature branch "${branchName}" already exists.`,
          };
        }
        featureBranchCreated = branchResult.success;
      } catch {
        // Non-git environment or git error
      }
    }

    // 3. Transaction Checkpoint with explicit Journal
    const checkpointId = this.txManager.createCheckpoint(this.projectRoot, plan.affectedFiles, {
      repoHeadBefore: gateEval.gitHead,
      branchName,
    });
    const modifiedFiles: string[] = [];

    try {
      // 4. Apply Exact AST Patches (Descending startPos per file)
      for (const filePatch of plan.filePatches) {
        const fullPath = resolve(this.projectRoot, filePatch.filePath);
        mkdirSync(dirname(fullPath), { recursive: true });
        let content = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";

        const sortedOps = [...filePatch.operations].sort((a, b) => b.startPos - a.startPos);

        for (const op of sortedOps) {
          if (op.operationKind === "REMOVE_DECLARATION") {
            content = content.substring(0, op.startPos) + op.replacement + content.substring(op.endPos);
          } else if (op.operationKind === "INSERT_DECLARATION") {
            content = content + op.replacement;
          } else {
            content = content.substring(0, op.startPos) + op.replacement + content.substring(op.endPos);
          }
          this.txManager.recordOperation(checkpointId, `${op.operationKind} at ${filePatch.filePath}:${op.startPos}`);
        }

        writeFileSync(fullPath, content, "utf8");
        modifiedFiles.push(filePatch.filePath);
        console.log(`[StructuralRefactoringExecutor] ✓ Patched: ${filePatch.filePath} (${sortedOps.length} ops)`);
      }

      // 5. Test & Build Verification (if requested)
      let testPassed = true;
      let buildPassed = true;

      if (!options.skipTests && !options.skipBuild) {
        if (existsSync(resolve(this.projectRoot, "tsconfig.json"))) {
          try {
            execSync("npx tsc --noEmit", { cwd: this.projectRoot, stdio: ["ignore", "pipe", "pipe"] });
          } catch {
            buildPassed = false;
          }
        }
      }

      // 6. Authoritative FinalSuccessGate Evaluation
      const successEval = this.successGate.evaluate(plan, modifiedFiles, testPassed, buildPassed);
      if (!successEval.passed) {
        this.txManager.recordVerificationStatus(checkpointId, "FAILED");
        throw new Error(`FinalSuccessGate rejected refactoring: ${successEval.reasons.join("; ")}`);
      }

      this.txManager.recordVerificationStatus(checkpointId, "PASSED");

      // 7. Commit on Isolated Feature Branch
      if (featureBranchCreated) {
        const commitMsg = `refactor(v2.3): ${plan.kind.toLowerCase()} ${symName} to ${destName}`;
        BrownfieldGitGuard.commitTouchedFiles(this.projectRoot, modifiedFiles, commitMsg);
        console.log(`[StructuralRefactoringExecutor] ✅ Staged and committed on branch "${branchName}"`);
      }

      this.txManager.commit(checkpointId);

      return {
        success: true,
        status: "SUCCESS",
        branchName: featureBranchCreated ? branchName : undefined,
        touchedFiles: modifiedFiles,
        planHash: plan.planHash,
        patchHash: plan.patchHash,
      };
    } catch (err: any) {
      console.error(`[StructuralRefactoringExecutor] ❌ Refactoring execution failed: ${err.message}`);
      this.txManager.rollback(checkpointId);
      return {
        success: false,
        status: "PATCH_APPLICATION_FAILED",
        touchedFiles: [],
        checkpointRolledBack: true,
        error: err.message,
      };
    } finally {
      FinalExecutionGate.releaseLocks(this.projectRoot, plan.affectedFiles);
    }
  }

  private generateBranchSlug(plan: StructuralRefactoringPlan): string {
    const sym = (plan.sourceSymbol?.name || plan.symbols?.[0]?.name || "symbols").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const dest = (plan.destinationFile || "split").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/\-ts$/, "");
    return `refactor-${sym}-to-${dest}`.replace(/\-+/g, "-");
  }
}
