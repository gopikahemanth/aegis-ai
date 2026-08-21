/**
 * RenamePreviewEngine — Aegis V2.3 Project 2 Phase 3
 *
 * Implements deterministic in-memory rename preview, unified diff calculation,
 * risk classification, and cryptographic plan/patch integrity validation.
 *
 * INVARIANTS:
 * 1. SIDE-EFFECT FREE: Zero file writes, zero Git branch or staging mutations during preview.
 * 2. IMMUTABLE INTEGRITY: Execution must verify disk preimages against preview.planHash
 *    and preview.patchHash.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ASTSymbolRenamePlanner } from "./ast-symbol-rename-planner.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";
import type {
  SymbolRenameRequest,
  RenamePreview,
  SymbolRenamePlan,
} from "./symbol-rename-contract.js";

export class RenamePreviewEngine {
  /**
   * Generates a side-effect-free RenamePreview.
   * NEVER mutates files, branches, or Git index.
   */
  public static generatePreview(
    request: SymbolRenameRequest,
    planner?: ASTSymbolRenamePlanner
  ): RenamePreview {
    const projectRoot = request.projectPath.replace(/\\/g, "/");
    const activePlanner = planner || new ASTSymbolRenamePlanner(projectRoot);

    const plan: SymbolRenamePlan = activePlanner.planRename(request);

    // 1. Compute in-memory file diffs
    const fileDiffs: FilePatchDiff[] = [];
    let totalInsertions = 0;
    let totalDeletions = 0;
    const preimages: Record<string, string> = {};

    for (const patch of plan.patches) {
      const fullPath = resolve(projectRoot, patch.filePath);
      if (!existsSync(fullPath)) continue;

      const originalContent = readFileSync(fullPath, "utf8");
      const originalHash = createHash("sha256").update(originalContent).digest("hex");
      preimages[patch.filePath] = originalHash;

      // Apply patches in memory
      let simulatedContent = originalContent;
      // ops are already sorted descending by startPos
      for (const op of patch.operations) {
        simulatedContent =
          simulatedContent.slice(0, op.startPos) +
          op.replacementSnippet +
          simulatedContent.slice(op.endPos);
      }

      const diffResult = this.createUnifiedDiff(
        patch.filePath,
        originalContent,
        simulatedContent
      );

      fileDiffs.push({
        filePath: patch.filePath,
        operations: patch.operations,
        oldContentSnippet: originalContent.slice(0, 300),
        newContentSnippet: simulatedContent.slice(0, 300),
        unifiedDiff: diffResult.diff,
        linesAdded: diffResult.added,
        linesRemoved: diffResult.removed,
      });

      totalInsertions += diffResult.added;
      totalDeletions += diffResult.removed;
    }

    // For any required files without patches (e.g. read-only context), capture preimages
    for (const req of plan.requiredFiles) {
      if (!preimages[req]) {
        const full = resolve(projectRoot, req);
        if (existsSync(full)) {
          preimages[req] = createHash("sha256").update(readFileSync(full)).digest("hex");
        }
      }
    }

    const diffSummary: DiffSummary = {
      filesChanged: fileDiffs.length,
      insertions: totalInsertions,
      deletions: totalDeletions,
    };

    // 2. Risk classification
    let riskLevel: RiskLevel = "LOW";
    if (plan.status !== "READY" || plan.conflicts.length > 0 || plan.blockedReasons.length > 0) {
      riskLevel = "BLOCKED";
    } else if (plan.requiredFiles.length > 10) {
      riskLevel = "HIGH";
    } else if (plan.requiredFiles.length > 3) {
      riskLevel = "MEDIUM";
    }

    const isApplyAllowed = plan.status === "READY" && plan.conflicts.length === 0 && plan.blockedReasons.length === 0;

    const slug = `${request.symbolName}-to-${request.newName}`.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const branchName = `aegis/refactor/${slug}`;

    return {
      mode: "BROWNFIELD_REFACTOR",
      repository: projectRoot,
      sourceFile: plan.sourceSymbol.filePath,
      symbolName: request.symbolName,
      symbolKind: plan.sourceSymbol.kind,
      newName: request.newName,
      slug,
      branchName,
      planHash: plan.planHash,
      patchHash: plan.patchHash,
      status: plan.status,
      riskLevel,
      requiredFiles: plan.requiredFiles,
      mayChangeFiles: plan.referenceFiles,
      readOnlyFiles: [],
      conflicts: plan.conflicts,
      blockedReasons: plan.blockedReasons,
      filePatches: plan.patches,
      fileDiffs,
      diffSummary,
      isApplyAllowed,
      preimages,
    };
  }

  /**
   * Verifies that the preview hashes and preimages match the current disk state.
   */
  public static verifyImmutability(
    preview: RenamePreview,
    projectRoot: string
  ): { valid: boolean; error?: string } {
    const root = projectRoot.replace(/\\/g, "/");

    for (const [filePath, expectedHash] of Object.entries(preview.preimages)) {
      const fullPath = resolve(root, filePath);
      if (!existsSync(fullPath)) {
        return {
          valid: false,
          error: `PLAN_STALE: Required file "${filePath}" was deleted since preview was generated.`,
        };
      }

      const currentContent = readFileSync(fullPath, "utf8");
      const currentHash = createHash("sha256").update(currentContent).digest("hex");
      if (currentHash !== expectedHash) {
        return {
          valid: false,
          error: `PLAN_STALE: File "${filePath}" has changed on disk since preview was generated. Preimage mismatch.`,
        };
      }
    }

    return { valid: true };
  }

  // ── Unified Diff Generator ───────────────────────────────────────────────────

  private static createUnifiedDiff(
    filePath: string,
    oldStr: string,
    newStr: string
  ): { diff: string; added: number; removed: number } {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    const lines: string[] = [
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ];

    let added = 0;
    let removed = 0;

    // Simple line-level diff output
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        lines.push(` ${oldLines[i]}`);
        i++;
        j++;
      } else if (j < newLines.length && (i >= oldLines.length || !oldLines.includes(newLines[j]))) {
        lines.push(`+${newLines[j]}`);
        added++;
        j++;
      } else if (i < oldLines.length) {
        lines.push(`-${oldLines[i]}`);
        removed++;
        i++;
      }
    }

    return { diff: lines.join("\n"), added, removed };
  }
}
