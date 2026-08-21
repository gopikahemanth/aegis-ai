/**
 * FileRefactoringExecutor — Aegis V2.3 Project 2 Phase 5
 *
 * Transactional executor for file renames and moves:
 * - Immutability verification
 * - Git dirty target preflight check
 * - Feature branch isolation
 * - Multi-file checkpointing
 * - Windows case-only rename safety
 * - Disk file move & AST import/export rewriting
 * - Atomic rollback on error
 */

import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { FileOperationPlanner } from "./file-operation-planner.js";
import { FileRefactoringPreviewEngine } from "./file-refactoring-preview.js";
import type {
  FileRefactoringRequest,
  FileRefactoringExecutionResult,
} from "./file-refactoring-contract.js";

export class FileRefactoringExecutor {
  private readonly projectRoot: string;
  private readonly txManager = new BrownfieldTransactionManager();
  private readonly planner: FileOperationPlanner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.planner = new FileOperationPlanner(this.projectRoot);
  }

  /**
   * Executes a safe, transactional file refactoring operation.
   */
  public async execute(request: FileRefactoringRequest): Promise<FileRefactoringExecutionResult> {
    console.log(`[FileRefactoringExecutor] 🛡️ Starting operation "${request.operation}": "${request.sourcePath}" → "${request.targetPath}"`);

    // 0. Plan or use existing preview
    let preview = request.preview;
    if (!preview) {
      preview = FileRefactoringPreviewEngine.generatePreview(request, this.planner);
    }

    // 1. Verify Immutability
    const immutabilityCheck = FileRefactoringPreviewEngine.verifyImmutability(preview, this.projectRoot);
    if (!immutabilityCheck.valid) {
      console.warn(`[FileRefactoringExecutor] 🛑 Plan immutability check failed: ${immutabilityCheck.error}`);
      return {
        success: false,
        status: "PLAN_STALE",
        sourcePath: request.sourcePath,
        targetPath: request.targetPath,
        touchedFiles: [],
        error: immutabilityCheck.error,
      };
    }

    // 2. Reject if preview is not allowed (conflicts, blockers, incomplete)
    if (!preview.isApplyAllowed || preview.status !== "READY") {
      console.warn(`[FileRefactoringExecutor] 🛑 Refactoring blocked: status=${preview.status}, reasons=${preview.blockedReasons.join("; ")}`);
      return {
        success: false,
        status: preview.status,
        sourcePath: request.sourcePath,
        targetPath: request.targetPath,
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
      console.warn(`[FileRefactoringExecutor] 🛑 Target files have uncommitted edits: ${dirtyTargets.join(", ")}`);
      return {
        success: false,
        status: "GIT_DIRTY_TARGET",
        sourcePath: request.sourcePath,
        targetPath: request.targetPath,
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
        console.warn(`[FileRefactoringExecutor] 🛑 Feature branch "${branchName}" already exists.`);
        return {
          success: false,
          status: "BLOCKED",
          sourcePath: request.sourcePath,
          targetPath: request.targetPath,
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

    const fullSource = resolve(this.projectRoot, request.sourcePath);
    const fullTarget = resolve(this.projectRoot, request.targetPath);

    try {
      // 6. Execute File Rename / Move on disk
      mkdirSync(dirname(fullTarget), { recursive: true });

      if (preview.isCaseOnlyRename) {
        // Windows safe 2-step rename via temporary file
        const tempPath = fullSource + ".__aegis_case_tmp__";
        renameSync(fullSource, tempPath);
        renameSync(tempPath, fullTarget);
      } else {
        renameSync(fullSource, fullTarget);
      }
      touchedFiles.push(request.targetPath);
      console.log(`[FileRefactoringExecutor] ✓ Moved file: "${request.sourcePath}" → "${request.targetPath}"`);

      // 7. Apply AST import/export rewrite patches to disk files
      for (const patch of preview.filePatches) {
        const fullPath = resolve(this.projectRoot, patch.filePath === request.sourcePath ? request.targetPath : patch.filePath);
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
        if (!touchedFiles.includes(patch.filePath)) {
          touchedFiles.push(patch.filePath);
        }
        console.log(`[FileRefactoringExecutor] ✓ Applied import patches in: ${patch.filePath} (${patch.operations.length} operations)`);
      }

      console.log(`[FileRefactoringExecutor] ✅ File refactoring completed successfully across ${touchedFiles.length} file(s).`);

      return {
        success: true,
        status: "SUCCESS",
        branchName,
        sourcePath: request.sourcePath,
        targetPath: request.targetPath,
        touchedFiles,
        planHash: preview.planHash,
        patchHash: preview.patchHash,
      };
    } catch (err: any) {
      console.error(`[FileRefactoringExecutor] ❌ File refactoring failed, rolling back: ${err?.message}`);

      // Restore moved file if target was created
      if (existsSync(fullTarget) && !existsSync(fullSource)) {
        try {
          renameSync(fullTarget, fullSource);
        } catch {}
      }

      this.txManager.rollback(checkpointId);

      return {
        success: false,
        status: "BLOCKED",
        sourcePath: request.sourcePath,
        targetPath: request.targetPath,
        touchedFiles: [],
        checkpointRolledBack: true,
        error: `File refactoring execution failed: ${err?.message}`,
      };
    }
  }
}
