/**
 * HttpContractExecutor — Aegis V2.3 Project 2 Phase 7.2
 *
 * Transactional executor for HTTP contract refactorings:
 * - Immutability verification
 * - Git dirty target preflight check
 * - Feature branch isolation
 * - Multi-file checkpointing
 * - Atomic AST patching across server route and client consumer files
 * - Full transactional rollback on failure
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrownfieldGitGuard } from "../../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../../brownfield-transaction-manager.js";
import { HttpContractPreviewEngine } from "./http-contract-preview.js";
import type {
  HttpContractRequest,
  HttpContractExecutionResult,
} from "./http-contract-model.js";

export class HttpContractExecutor {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Executes a safe, transactional HTTP contract refactoring operation.
   */
  public async execute(request: HttpContractRequest): Promise<HttpContractExecutionResult> {
    console.log(`[HttpContractExecutor] 🛡️ Starting operation "${request.operation}" on "${request.endpointMethod} ${request.endpointPath}" in "${request.sourceFile}"`);

    // 0. Plan or use existing preview
    let preview = request.preview;
    if (!preview) {
      preview = HttpContractPreviewEngine.generatePreview(request);
    }

    // 1. Verify Immutability
    const immutabilityCheck = HttpContractPreviewEngine.verifyImmutability(preview, this.projectRoot);
    if (!immutabilityCheck.valid) {
      console.warn(`[HttpContractExecutor] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
      return {
        success: false,
        status: "PLAN_STALE",
        touchedFiles: [],
        error: immutabilityCheck.error,
      };
    }

    // 2. Reject if preview is not allowed (unresolved endpoint, conflicts, blockers)
    if (!preview.isApplyAllowed || preview.status !== "READY") {
      console.warn(`[HttpContractExecutor] 🛑 Refactoring blocked: status=${preview.status}, reasons=${preview.blockedReasons.join("; ")}`);
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
      console.warn(`[HttpContractExecutor] 🛑 Target files have uncommitted edits: ${dirtyTargets.join(", ")}`);
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
        console.warn(`[HttpContractExecutor] 🛑 Feature branch "${branchName}" already exists.`);
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
      // 6. Apply AST patches to server route and client consumer files
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
        console.log(`[HttpContractExecutor] ✓ Applied HTTP contract patch in: ${patch.filePath} (${patch.operations.length} operations)`);
      }

      console.log(`[HttpContractExecutor] ✅ HTTP contract refactoring completed successfully across ${touchedFiles.length} file(s).`);

      return {
        success: true,
        status: "SUCCESS",
        branchName,
        touchedFiles,
        planHash: preview.planHash,
        patchHash: preview.patchHash,
      };
    } catch (err: any) {
      console.error(`[HttpContractExecutor] ❌ HTTP contract refactoring failed, rolling back: ${err?.message}`);
      this.txManager.rollback(checkpointId);

      return {
        success: false,
        status: "BLOCKED",
        touchedFiles: [],
        checkpointRolledBack: true,
        error: `HTTP contract refactoring execution failed: ${err?.message}`,
      };
    }
  }
}
