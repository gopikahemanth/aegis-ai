/**
 * StructuralRefactoringPreviewEngine — Aegis V2.3 Project 2 Phase 4.3
 *
 * Side-effect-free preview engine for structural refactorings:
 * - Generates deterministic unified diffs per affected file
 * - Evaluates risk levels, public API impact, and required tests
 * - Computes immutable planHash & patchHash
 * - 0 disk mutations, 0 branch creations, 0 git operations
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RiskLevel, FilePatchDiff } from "../patch-preview-engine.js";
import { PublicApiCompatibilityVerifier } from "./public-api-compatibility-verifier.js";
import type {
  StructuralRefactoringPlan,
  StructuralRefactoringTransformation,
  StructuralRefactoringStatus,
  ExportStatus,
} from "./structural-refactoring-contract.js";

export interface StructuralRefactoringPreview {
  planHash: string;
  patchHash: string;
  kind: string;
  sourceSymbol?: string;
  sourceFile: string;
  destinationFile?: string;
  affectedFiles: string[];
  patchOperationsCount: number;
  fileDiffs: FilePatchDiff[];
  riskLevel: RiskLevel;
  impactStatus: StructuralRefactoringStatus;
  warnings: string[];
  blockedReasons: string[];
  requiredTests: string[];
  publicApiImpact: ExportStatus;
  preimages: Record<string, string>;
  isApplyAllowed: boolean;
}

export class StructuralRefactoringPreviewEngine {
  private readonly projectRoot: string;
  private readonly publicApiVerifier: PublicApiCompatibilityVerifier;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.publicApiVerifier = new PublicApiCompatibilityVerifier(this.projectRoot);
  }

  /**
   * Generates a side-effect-free preview of a structural refactoring plan and transformation.
   */
  public generatePreview(
    plan: StructuralRefactoringPlan,
    transformation?: StructuralRefactoringTransformation
  ): StructuralRefactoringPreview {
    const affectedFiles = [...plan.affectedFiles].sort();
    const warnings = [...plan.warnings];
    const blockedReasons = [...plan.blockedReasons];
    const requiredTests: string[] = [];

    // Public API compatibility analysis
    const pubResult = this.publicApiVerifier.verifyPlan(plan);
    let publicApiImpact: ExportStatus = "LOCAL_ONLY";
    if (pubResult.isPublicApi) {
      publicApiImpact = "PACKAGE_PUBLIC";
      warnings.push(...pubResult.warnings);
      if (pubResult.isBreaking) {
        blockedReasons.push(...pubResult.issues);
      }
    }

    // Determine affected tests
    for (const f of affectedFiles) {
      const base = f.replace(/\.[^/.]+$/, "");
      const testCandidate = `${base}.test.ts`;
      if (existsSync(resolve(this.projectRoot, testCandidate))) {
        requiredTests.push(testCandidate);
      }
    }

    // Generate unified diffs per file in-memory
    const fileDiffs: FilePatchDiff[] = [];
    const operations = transformation ? transformation.patchOperations : plan.patchOperations;

    for (const filePath of affectedFiles) {
      const fullPath = resolve(this.projectRoot, filePath);
      const originalContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";

      const fileOps = operations.filter(op => op.filePath === filePath);
      const sortedOps = [...fileOps].sort((a, b) => b.startPos - a.startPos);

      let patchedContent = originalContent;
      for (const op of sortedOps) {
        if (op.operationKind === "REMOVE_DECLARATION") {
          patchedContent = patchedContent.substring(0, op.startPos) + op.replacement + patchedContent.substring(op.endPos);
        } else if (op.operationKind === "INSERT_DECLARATION") {
          patchedContent = (patchedContent ? patchedContent + (patchedContent.endsWith("\n") ? "" : "\n") : "") + op.replacement;
        } else {
          patchedContent = patchedContent.substring(0, op.startPos) + op.replacement + patchedContent.substring(op.endPos);
        }
      }

      const origLines = originalContent ? originalContent.split("\n") : [];
      const patchLines = patchedContent ? patchedContent.split("\n") : [];
      const unifiedDiff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${origLines.length} +1,${patchLines.length} @@\n` +
        origLines.map(l => `-${l}`).join("\n") + "\n" + patchLines.map(l => `+${l}`).join("\n");

      fileDiffs.push({
        filePath,
        operations: [],
        oldContentSnippet: originalContent.substring(0, 200),
        newContentSnippet: patchedContent.substring(0, 200),
        unifiedDiff,
        linesAdded: patchLines.length,
        linesRemoved: origLines.length,
      });
    }

    const planHash = plan.planHash;
    const patchHash = transformation ? transformation.patchHash : plan.patchHash;
    const isApplyAllowed = plan.isApplyAllowed && blockedReasons.length === 0;
    const impactStatus: StructuralRefactoringStatus = isApplyAllowed ? "READY" : (plan.impactStatus === "READY" ? "BLOCKED" : plan.impactStatus);

    return {
      planHash,
      patchHash,
      kind: plan.kind,
      sourceSymbol: plan.sourceSymbol?.name || plan.symbols?.[0]?.name,
      sourceFile: plan.sourceFile,
      destinationFile: plan.destinationFile,
      affectedFiles,
      patchOperationsCount: operations.length,
      fileDiffs,
      riskLevel: plan.riskLevel,
      impactStatus,
      warnings,
      blockedReasons,
      requiredTests,
      publicApiImpact,
      preimages: plan.preimages,
      isApplyAllowed,
    };
  }
}
