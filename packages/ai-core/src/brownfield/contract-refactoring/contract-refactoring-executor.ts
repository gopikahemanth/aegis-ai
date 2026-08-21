/**
 * ContractRefactoringExecutor — Aegis V2.3 Project 2 Phase 6
 *
 * Transactional executor for cross-file contract, DTO, service, and API client refactorings:
 * - Immutability verification
 * - Git dirty target preflight check
 * - Feature branch isolation
 * - Multi-file checkpointing
 * - Atomic AST patching across producer-to-consumer chain
 * - Full transactional rollback on failure
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { ContractRefactoringPreviewEngine } from "./contract-refactoring-preview.js";
import type {
  ContractRefactoringRequest,
  ContractRefactoringExecutionResult,
} from "./contract-refactoring-contract.js";

export class ContractRefactoringExecutor {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Executes a safe, transactional contract refactoring operation.
   */
  public async execute(request: ContractRefactoringRequest): Promise<ContractRefactoringExecutionResult> {
    console.log(`[ContractRefactoringExecutor] 🛡️ Starting operation "${request.operation}" on "${request.targetSymbol}" in "${request.sourceFile}"`);

    // 0. Plan or use existing preview
    let preview = request.preview;
    if (!preview) {
      preview = ContractRefactoringPreviewEngine.generatePreview(request);
    }

    // 1. Verify Immutability
    const immutabilityCheck = ContractRefactoringPreviewEngine.verifyImmutability(preview, this.projectRoot);
    if (!immutabilityCheck.valid) {
      console.warn(`[ContractRefactoringExecutor] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
      return {
        success: false,
        status: "PLAN_STALE",
        touchedFiles: [],
        error: immutabilityCheck.error,
      };
    }

    // 2. Reject if preview is not allowed (conflicts, blockers, incomplete)
    if (!preview.isApplyAllowed || preview.status !== "READY") {
      console.warn(`[ContractRefactoringExecutor] 🛑 Refactoring blocked: status=${preview.status}, reasons=${preview.blockedReasons.join("; ")}`);
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
      console.warn(`[ContractRefactoringExecutor] 🛑 Target files have uncommitted edits: ${dirtyTargets.join(", ")}`);
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
        console.warn(`[ContractRefactoringExecutor] 🛑 Feature branch "${branchName}" already exists.`);
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
        console.log(`[ContractRefactoringExecutor] ✓ Applied contract patch in: ${patch.filePath} (${patch.operations.length} operations)`);
      }

      console.log(`[ContractRefactoringExecutor] ✅ Contract refactoring completed successfully across ${touchedFiles.length} file(s).`);

      return {
        success: true,
        status: "SUCCESS",
        branchName,
        touchedFiles,
        planHash: preview.planHash,
        patchHash: preview.patchHash,
      };
    } catch (err: any) {
      console.error(`[ContractRefactoringExecutor] ❌ Contract refactoring failed, rolling back: ${err?.message}`);
      this.txManager.rollback(checkpointId);

      return {
        success: false,
        status: "BLOCKED",
        touchedFiles: [],
        checkpointRolledBack: true,
        error: `Contract refactoring execution failed: ${err?.message}`,
      };
    }
  }
}
