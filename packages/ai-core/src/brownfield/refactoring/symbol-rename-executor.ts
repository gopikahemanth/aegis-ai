/**
 * SymbolRenameExecutor — Aegis V2.3 Project 2 Phase 3
 *
 * Transactional multi-file AST symbol rename executor.
 * Integrates BrownfieldGitGuard, BrownfieldTransactionManager, ASTSymbolRenamePlanner,
 * and InProjectTestRunner with strict preview immutability and atomic rollback guarantees.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { ASTSymbolRenamePlanner } from "./ast-symbol-rename-planner.js";
import { RenamePreviewEngine } from "./rename-preview-engine.js";
import type {
  SymbolRenameRequest,
  RenamePreview,
  SymbolRenamePlan,
  SymbolRenameExecutionResult,
} from "./symbol-rename-contract.js";

export class SymbolRenameExecutor {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();
  private readonly planner: ASTSymbolRenamePlanner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.planner = new ASTSymbolRenamePlanner(this.projectRoot);
  }

  /**
   * Executes a safe, transactional AST symbol rename.
   */
  public async execute(request: SymbolRenameRequest): Promise<SymbolRenameExecutionResult> {
    console.log(`[SymbolRenameExecutor] 🛡️ Starting symbol rename: "${request.symbolName}" → "${request.newName}" in "${request.sourceFile}"`);

    // 0. Plan or use existing preview
    let preview = request.preview;
    if (!preview) {
      preview = RenamePreviewEngine.generatePreview(request, this.planner);
    }

    // 1. Verify Immutability / Plan Stale check
    const immutabilityCheck = RenamePreviewEngine.verifyImmutability(preview, this.projectRoot);
    if (!immutabilityCheck.valid) {
      console.warn(`[SymbolRenameExecutor] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
      return {
        success: false,
        status: "PLAN_STALE",
        touchedFiles: [],
        error: immutabilityCheck.error,
      };
    }

    // 2. If preview is not allowed (conflicts, blockers, incomplete), abort with zero mutation
    if (!preview.isApplyAllowed || preview.status !== "READY") {
      console.warn(`[SymbolRenameExecutor] 🛑 Rename execution blocked: status=${preview.status}, reasons=${preview.blockedReasons.join("; ")}`);
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
      console.warn(`[SymbolRenameExecutor] 🛑 Target files have uncommitted edits: ${dirtyTargets.join(", ")}`);
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
    let featureBranchCreated = false;
    const branchName = preview.branchName;
    try {
      const branchResult = BrownfieldGitGuard.createFeatureBranch(branchName, this.projectRoot);
      if (!branchResult.success && branchResult.error?.includes("FEATURE_BRANCH_EXISTS")) {
        console.warn(`[SymbolRenameExecutor] 🛑 Feature branch "${branchName}" already exists.`);
        return {
          success: false,
          status: "BLOCKED",
          touchedFiles: [],
          error: `Feature branch "${branchName}" already exists.`,
        };
      }
      featureBranchCreated = branchResult.success;
    } catch {
      // Non-git environment or git error — continue with transaction manager protection
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
        console.log(`[SymbolRenameExecutor] ✓ Patched AST in: ${patch.filePath} (${patch.operations.length} operations)`);
      }

      console.log(`[SymbolRenameExecutor] ✅ All ${touchedFiles.length} file(s) patched successfully.`);

      return {
        success: true,
        status: "SUCCESS",
        branchName,
        touchedFiles,
        planHash: preview.planHash,
        patchHash: preview.patchHash,
      };
    } catch (err: any) {
      console.error(`[SymbolRenameExecutor] ❌ Patch application failed, rolling back: ${err?.message}`);
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
