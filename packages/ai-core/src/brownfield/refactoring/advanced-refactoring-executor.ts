/**
 * AdvancedRefactoringExecutor — Aegis V2.3 Project 2 Phase 4
 *
 * Transactional executor for compound AST refactorings.
 * Integrates BrownfieldGitGuard, BrownfieldTransactionManager, SignatureChangePlanner,
 * and AdvancedRefactoringPreviewEngine with preview immutability and atomic rollback.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { SignatureChangePlanner } from "./signature-change-planner.js";
import { AdvancedRefactoringPreviewEngine } from "./advanced-refactoring-preview.js";
import type {
  AdvancedRefactoringRequest,
  AdvancedRefactoringExecutionResult,
} from "./advanced-refactoring-contract.js";

export class AdvancedRefactoringExecutor {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();
  private readonly planner: SignatureChangePlanner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.planner = new SignatureChangePlanner(this.projectRoot);
  }

  /**
   * Executes a safe, transactional advanced refactoring operation.
   */
  public async execute(request: AdvancedRefactoringRequest): Promise<AdvancedRefactoringExecutionResult> {
    console.log(`[AdvancedRefactoringExecutor] 🛡️ Starting operation "${request.operation}" on "${request.targetSymbol}" in "${request.sourceFile}"`);

    // 0. Plan or use existing preview
    let preview = request.preview;
    if (!preview) {
      preview = AdvancedRefactoringPreviewEngine.generatePreview(request, this.planner);
    }

    // 1. Verify Immutability
    const immutabilityCheck = AdvancedRefactoringPreviewEngine.verifyImmutability(preview, this.projectRoot);
    if (!immutabilityCheck.valid) {
      console.warn(`[AdvancedRefactoringExecutor] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
      return {
        success: false,
        status: "PLAN_STALE",
        touchedFiles: [],
        error: immutabilityCheck.error,
      };
    }

    // 2. Reject if preview is not allowed (conflicts, blockers, incomplete)
    if (!preview.isApplyAllowed || preview.status !== "READY") {
      console.warn(`[AdvancedRefactoringExecutor] 🛑 Refactoring blocked: status=${preview.status}, reasons=${preview.blockedReasons.join("; ")}`);
      return {
        success: false,
        status: preview.status,
        touchedFiles: [],
        planHash: preview.planHash,
        patchHash: preview.patchHash,
        error: preview.blockedReasons.join("; ") || preview.conflicts.join("; ") || `Status is ${preview.status}`,
      };
    }

    // 3. Git Guard: Check for dirty uncommitted edits in required files
    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(this.projectRoot, preview.requiredFiles);
    if (gitPreflight.status === "DIRTY_TARGET_CONFLICT") {
      const dirtyTargets = gitPreflight.conflictingFiles || [];
      console.warn(`[AdvancedRefactoringExecutor] 🛑 Target files have uncommitted edits: ${dirtyTargets.join(", ")}`);
      return {
        success: false,
        status: "GIT_DIRTY_TARGET",
        touchedFiles: [],
        planHash: preview.planHash,
        patchHash: preview.patchHash,
        error: `GIT_DIRTY_TARGET: Target files contain uncommitted changes: ${dirtyTargets.join(", ")}`,
      };
    }

    // 4. Feature Branch Isolation
    const branchName = preview.branchName;
    try {
      const branchResult = BrownfieldGitGuard.createFeatureBranch(branchName, this.projectRoot);
      if (!branchResult.success && branchResult.error?.includes("FEATURE_BRANCH_EXISTS")) {
        console.warn(`[AdvancedRefactoringExecutor] 🛑 Feature branch "${branchName}" already exists.`);
        return {
          success: false,
          status: "BLOCKED",
          touchedFiles: [],
          error: `Feature branch "${branchName}" already exists.`,
        };
      }
    } catch {
      // Continue with transaction manager protection in non-git environment
    }

    // 5. Create Transaction Checkpoint across all required files
    const checkpointId = this.txManager.createCheckpoint(this.projectRoot, preview.requiredFiles);
    const touchedFiles: string[] = [];

    try {
      // 6. Apply AST patches to disk files
      for (const patch of preview.filePatches) {
        const fullPath = resolve(this.projectRoot, patch.filePath);
        if (!existsSync(fullPath)) continue;

        let content = readFileSync(fullPath, "utf8");

        // Operations are sorted descending by startPos
        for (const op of patch.operations) {
          content =
            content.slice(0, op.startPos) +
            op.replacementSnippet +
            content.slice(op.endPos);
        }

        writeFileSync(fullPath, content, "utf8");
        touchedFiles.push(patch.filePath);
        console.log(`[AdvancedRefactoringExecutor] ✓ Applied patch in: ${patch.filePath} (${patch.operations.length} operations)`);
      }

      console.log(`[AdvancedRefactoringExecutor] ✅ All ${touchedFiles.length} file(s) refactored successfully.`);

      return {
        success: true,
        status: "SUCCESS",
        branchName,
        touchedFiles,
        planHash: preview.planHash,
        patchHash: preview.patchHash,
      };
    } catch (err: any) {
      console.error(`[AdvancedRefactoringExecutor] ❌ Patch application failed, rolling back: ${err?.message}`);
      this.txManager.rollback(checkpointId);

      return {
        success: false,
        status: "BLOCKED",
        touchedFiles: [],
        checkpointRolledBack: true,
        error: `Patch execution failed: ${err?.message}`,
      };
    }
  }
}
