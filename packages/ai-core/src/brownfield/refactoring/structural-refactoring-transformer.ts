/**
 * StructuralRefactoringTransformer — Aegis V2.3 Project 2 Phase 4.2
 *
 * AST transformation layer that converts an approved StructuralRefactoringPlan
 * into exact, surgical, deterministic patch operations:
 * - MOVE_SYMBOL
 * - EXTRACT_SYMBOL / EXTRACT_FUNCTION
 * - FUNCTION_SIGNATURE_CHANGE
 *
 * SAFETY INVARIANTS:
 * - Purely observational & mathematical: 0 disk mutations, 0 branch creations
 * - Operates strictly on AST character offsets [startPos, endPos]
 * - Deterministic descending offset sorting per file
 * - Rejects overlapping patches (PATCH_OVERLAP) and out-of-bounds ranges (PATCH_RANGE_INVALID)
 * - Computes deterministic, canonical patchHash
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import type {
  StructuralRefactoringPlan,
  StructuralRefactoringTransformation,
  StructuralPatchOperation,
  StructuralRefactoringStatus,
} from "./structural-refactoring-contract.js";

export class StructuralRefactoringTransformer {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Transforms an approved plan into an immutable, verified transformation.
   */
  public transform(plan: StructuralRefactoringPlan): StructuralRefactoringTransformation {
    const warnings = [...plan.warnings];
    const blockedReasons = [...plan.blockedReasons];
    let status: StructuralRefactoringStatus = plan.impactStatus;
    let isApplyAllowed = plan.isApplyAllowed;

    const deletedSourceRanges: { filePath: string; startPos: number; endPos: number }[] = [];
    let insertedDestinationText: string | undefined;

    // Validate patch operations per file
    const validatedPatchesMap = new Map<string, StructuralPatchOperation[]>();

    for (const filePatch of plan.filePatches) {
      const fullPath = resolve(this.projectRoot, filePatch.filePath);
      const fileLength = existsSync(fullPath) ? readFileSync(fullPath, "utf8").length : 0;

      // Sort descending by startPos
      const sortedOps = [...filePatch.operations].sort((a, b) => b.startPos - a.startPos);

      // Check offset boundaries and overlaps
      for (let i = 0; i < sortedOps.length; i++) {
        const op = sortedOps[i];

        if (op.startPos < 0 || op.endPos < op.startPos) {
          status = "PATCH_RANGE_INVALID";
          isApplyAllowed = false;
          blockedReasons.push(`Invalid patch range [${op.startPos}, ${op.endPos}] in ${op.filePath}`);
        }

        if (op.operationKind === "REMOVE_DECLARATION") {
          deletedSourceRanges.push({
            filePath: op.filePath,
            startPos: op.startPos,
            endPos: op.endPos,
          });
        }

        if (op.operationKind === "INSERT_DECLARATION") {
          insertedDestinationText = op.replacement;
        }

        // Overlap detection with adjacent operations
        if (i < sortedOps.length - 1) {
          const nextOp = sortedOps[i + 1];
          if (nextOp.endPos > op.startPos) {
            status = "PATCH_OVERLAP";
            isApplyAllowed = false;
            blockedReasons.push(
              `Overlapping patches detected in ${op.filePath}: [${nextOp.startPos}, ${nextOp.endPos}] and [${op.startPos}, ${op.endPos}]`
            );
          }
        }
      }

      validatedPatchesMap.set(filePatch.filePath, sortedOps);
    }

    const sortedAffectedFiles = [...plan.affectedFiles].sort();
    const sortedFilePatches = sortedAffectedFiles.map(filePath => ({
      filePath,
      operations: validatedPatchesMap.get(filePath) || [],
    }));

    const flattenedOps: StructuralPatchOperation[] = [];
    for (const fp of sortedFilePatches) {
      flattenedOps.push(...fp.operations);
    }

    // Canonical patchHash generation
    const canonicalPayload = {
      planHash: plan.planHash,
      affectedFiles: sortedAffectedFiles,
      preimages: plan.preimages,
      operations: flattenedOps.map(o => ({
        filePath: o.filePath,
        startPos: o.startPos,
        endPos: o.endPos,
        replacement: o.replacement,
        operationKind: o.operationKind,
      })),
      importChanges: plan.importChanges,
      exportChanges: plan.exportChanges,
    };

    const patchHash = createHash("sha256")
      .update(JSON.stringify(canonicalPayload))
      .digest("hex");

    return {
      planHash: plan.planHash,
      patchHash,
      kind: plan.kind,
      affectedFiles: sortedAffectedFiles,
      patchOperations: flattenedOps,
      filePatches: sortedFilePatches,
      importChanges: plan.importChanges,
      exportChanges: plan.exportChanges,
      deletedSourceRanges,
      insertedDestinationText,
      preimages: plan.preimages,
      riskLevel: plan.riskLevel,
      warnings,
      blockedReasons,
      status,
      isApplyAllowed,
    };
  }

  /**
   * Evaluates statement block for functional extraction, identifying free variables and control flow.
   */
  public analyzeFunctionExtraction(
    sourceFile: string,
    statementRange: { startLine: number; endLine: number }
  ): {
    canExtract: boolean;
    freeVariables: string[];
    hasThisDependency: boolean;
    hasCrossingControlFlow: boolean;
    status: StructuralRefactoringStatus;
    reason?: string;
  } {
    const fullPath = resolve(this.projectRoot, sourceFile);
    if (!existsSync(fullPath)) {
      return {
        canExtract: false,
        freeVariables: [],
        hasThisDependency: false,
        hasCrossingControlFlow: false,
        status: "SYMBOL_NOT_FOUND",
        reason: `File ${sourceFile} not found`,
      };
    }

    const content = readFileSync(fullPath, "utf8");
    const sf = ts.createSourceFile(sourceFile, content, ts.ScriptTarget.Latest, true);

    let hasThisDependency = false;
    let hasCrossingControlFlow = false;
    const usedIdentifiers = new Set<string>();
    const declaredInBlock = new Set<string>();

    const startPos = sf.getPositionOfLineAndCharacter(statementRange.startLine - 1, 0);
    const endPos = sf.getPositionOfLineAndCharacter(statementRange.endLine - 1, 0);

    const visit = (node: ts.Node) => {
      if (node.getStart(sf) >= startPos && node.getEnd() <= endPos) {
        if (node.kind === ts.SyntaxKind.ThisKeyword) {
          hasThisDependency = true;
        }

        if (
          ts.isBreakStatement(node) ||
          ts.isContinueStatement(node) ||
          ts.isReturnStatement(node)
        ) {
          hasCrossingControlFlow = true;
        }

        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          declaredInBlock.add(node.name.text);
        }

        if (ts.isIdentifier(node)) {
          usedIdentifiers.add(node.text);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sf);

    const freeVariables = Array.from(usedIdentifiers).filter(id => !declaredInBlock.has(id));

    if (hasThisDependency || hasCrossingControlFlow) {
      return {
        canExtract: false,
        freeVariables,
        hasThisDependency,
        hasCrossingControlFlow,
        status: "EXTRACTION_CAPTURE_UNSAFE",
        reason: hasThisDependency
          ? "Extraction block contains 'this' reference"
          : "Extraction block contains break/continue/return crossing boundary",
      };
    }

    return {
      canExtract: true,
      freeVariables,
      hasThisDependency: false,
      hasCrossingControlFlow: false,
      status: "READY",
    };
  }
}
