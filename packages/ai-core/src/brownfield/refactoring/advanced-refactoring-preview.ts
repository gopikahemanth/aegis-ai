/**
 * AdvancedRefactoringPreviewEngine — Aegis V2.3 Project 2 Phase 4
 *
 * Implements deterministic in-memory preview, unified diff calculation,
 * risk classification, and cryptographic plan/patch integrity validation
 * for compound AST refactorings.
 *
 * INVARIANTS:
 * 1. ZERO DISK MUTATION, zero Git branch creation, zero staging in dry-run preview.
 * 2. Immutable hash and preimage validation.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SignatureChangePlanner } from "./signature-change-planner.js";
import type { FilePatchDiff, DiffSummary } from "../patch-preview-engine.js";
import type {
  AdvancedRefactoringRequest,
  AdvancedRefactoringPreview,
  AdvancedRefactoringPlan,
} from "./advanced-refactoring-contract.js";

export class AdvancedRefactoringPreviewEngine {
  /**
   * Generates a side-effect-free in-memory preview of the advanced refactoring.
   */
  public static generatePreview(
    request: AdvancedRefactoringRequest,
    planner?: SignatureChangePlanner
  ): AdvancedRefactoringPreview {
    const projectRoot = request.projectPath.replace(/\\/g, "/");
    const activePlanner = planner || new SignatureChangePlanner(projectRoot);

    const plan: AdvancedRefactoringPlan = activePlanner.plan(request);

    // 1. Compute in-memory file diffs
    const fileDiffs: FilePatchDiff[] = [];
    let totalInsertions = 0;
    let totalDeletions = 0;
    const preimages: Record<string, string> = {};

    for (const patch of plan.patchOperations) {
      const fullPath = resolve(projectRoot, patch.filePath);
      if (!existsSync(fullPath)) continue;

      const originalContent = readFileSync(fullPath, "utf8");
      preimages[patch.filePath] = createHash("sha256").update(originalContent).digest("hex");

      let simulatedContent = originalContent;
      // ops are sorted descending by startPos
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

    for (const req of plan.affectedFiles) {
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

    const isApplyAllowed = plan.status === "READY" && plan.conflicts.length === 0 && plan.blockedReasons.length === 0;
    const slug = `${request.operation.toLowerCase()}-${request.targetSymbol.toLowerCase()}`.replace(/[^a-z0-9_-]/g, "-");
    const branchName = `aegis/refactor/${slug}`;

    return {
      mode: "ADVANCED_REFACTOR",
      operation: request.operation,
      repository: projectRoot,
      targetSymbol: request.targetSymbol,
      sourceFile: request.sourceFile,
      branchName,
      planHash: plan.planHash,
      patchHash: plan.patchHash,
      status: plan.status,
      riskLevel: plan.riskLevel,
      requiredFiles: plan.affectedFiles,
      mayChangeFiles: plan.affectedFiles.filter(f => f !== request.sourceFile),
      readOnlyFiles: [],
      conflicts: plan.conflicts,
      blockedReasons: plan.blockedReasons,
      filePatches: plan.patchOperations,
      fileDiffs,
      diffSummary,
      isApplyAllowed,
      preimages,
    };
  }

  /**
   * Verifies preview immutability against current disk preimages.
   */
  public static verifyImmutability(
    preview: AdvancedRefactoringPreview,
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
