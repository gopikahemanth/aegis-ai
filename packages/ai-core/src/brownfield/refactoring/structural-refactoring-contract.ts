/**
 * Structural Refactoring Contract — Aegis V2.3 Project 2 Phase 4.2 & Phase 5
 *
 * Types, interfaces, and data models for advanced structural code refactoring:
 * - Multi-symbol moves & extractions across modules
 * - Module splitting & merging with dependency closure calculation
 * - Import consolidation & export normalization
 * - Function signature refactoring & AST transformations
 * - Topological dependency-aware declaration ordering
 * - Public API compatibility analysis & classification
 * - Deterministic cryptographic planHash & patchHash
 */

import type { RiskLevel, FilePatchDiff, DiffSummary } from "../patch-preview-engine.js";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type StructuralRefactoringKind =
  | "MOVE_SYMBOL"
  | "MULTI_MOVE_SYMBOL"
  | "EXTRACT_SYMBOL"
  | "MULTI_EXTRACT_SYMBOL"
  | "SPLIT_MODULE"
  | "MERGE_MODULES"
  | "CONSOLIDATE_IMPORTS"
  | "NORMALIZE_EXPORTS"
  | "INLINE_SYMBOL"
  | "ORGANIZE_IMPORTS"
  | "FUNCTION_SIGNATURE_CHANGE"
  | "EXTRACT_FUNCTION";

export type StructuralRefactoringStatus =
  | "READY"
  | "SUCCESS"
  | "BLOCKED"
  | "IMPACT_ANALYSIS_INCOMPLETE"
  | "SYMBOL_NOT_FOUND"
  | "DESTINATION_INVALID"
  | "SYMBOL_COLLISION"
  | "IMPORT_COLLISION"
  | "EXPORT_COLLISION"
  | "CIRCULAR_DEPENDENCY_CREATED"
  | "DYNAMIC_DEPENDENCY_BLOCKED"
  | "PRIVATE_DEPENDENCY_UNAVAILABLE"
  | "PUBLIC_API_IMPACT"
  | "GIT_DIRTY_TARGET"
  | "PLAN_STALE"
  | "PATCH_DRIFT"
  | "PREIMAGE_MISMATCH"
  | "MAIN_BRANCH_DRIFT"
  | "FEATURE_BRANCH_EXISTS"
  | "PATCH_APPLICATION_FAILED"
  | "STRUCTURAL_VERIFICATION_FAILED"
  | "UNSUPPORTED_TRANSFORMATION"
  | "SIGNATURE_CALLSITE_UNSAFE"
  | "EXTRACTION_CAPTURE_UNSAFE"
  | "PATCH_OVERLAP"
  | "PATCH_RANGE_INVALID"
  | "TEST_REGRESSION"
  | "BUILD_FAILED";

export type ExportStatus = "LOCAL_ONLY" | "INTERNAL_EXPORT" | "PACKAGE_PUBLIC";

export type LocalDependencyKind =
  | "LOCAL_MOVED_WITH_SYMBOL"
  | "EXTERNAL_IMPORT"
  | "PROJECT_SYMBOL"
  | "PRIVATE_UNAVAILABLE"
  | "UNRESOLVED";

// ─── Structural Identity & Changes ─────────────────────────────────────────────

export interface StructuralSymbolIdentity {
  symbolId: string;
  name: string;
  kind: string;
  sourceFile: string;
  declarationStart: number;
  declarationEnd: number;
  line: number;
  column: number;
  exportStatus: ExportStatus;
  declarationSnippet?: string;
}

export interface LocalDependencyRef {
  symbolName: string;
  kind: LocalDependencyKind;
  declaredInFile: string;
  isExported: boolean;
}

export interface StructuralImportChange {
  consumerFile: string;
  oldModulePath: string;
  newModulePath: string;
  importedSymbol: string;
  localAlias?: string;
  importKind: "NAMED" | "DEFAULT" | "NAMESPACE" | "TYPE_ONLY";
  startPos: number;
  endPos: number;
}

export interface StructuralExportChange {
  file: string;
  exportedName: string;
  localName: string;
  exportKind: "NAMED" | "RE_EXPORT" | "BARREL_RE_EXPORT";
  sourceModule?: string;
  startPos: number;
  endPos: number;
}

export interface StructuralPatchOperation {
  filePath: string;
  startPos: number;
  endPos: number;
  originalSnippet: string;
  replacement: string;
  operationKind: "UPDATE_IMPORT" | "UPDATE_EXPORT" | "REMOVE_DECLARATION" | "INSERT_DECLARATION" | "INSERT_EXPORT" | "CONSOLIDATE_IMPORT" | "UPDATE_DECLARATION";
  description: string;
  sourceNodeKind?: string;
  operationId?: string;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface StructuralRefactoringRequest {
  kind: StructuralRefactoringKind;
  projectPath?: string;
  sourceFile: string;
  symbolName?: string;
  symbolId?: string;
  destinationFile?: string;
  allowBreakingPublicApi?: boolean;
}

export interface MultiSymbolMoveRequest {
  sourceFile: string;
  symbolNames: string[];
  destinationFile: string;
  allowBreakingPublicApi?: boolean;
}

export interface MultiSymbolExtractRequest {
  sourceFile: string;
  symbolNames: string[];
  destinationFile: string;
  reExportFromSource?: boolean;
  options?: { reExportFromSource?: boolean };
}

export interface SplitModuleRequest {
  sourceFile: string;
  groups: {
    destinationFile: string;
    symbolNames: string[];
  }[];
  options?: { reExportFromSource?: boolean };
}

export interface MergeModulesRequest {
  sourceFiles: string[];
  destinationFile: string;
  options?: { reExportFromSources?: boolean };
}

export interface StructuralRefactoringPlan {
  operationId: string;
  kind: StructuralRefactoringKind;
  sourceSymbol?: StructuralSymbolIdentity;
  symbols?: StructuralSymbolIdentity[];
  sourceFile: string;
  destinationFile?: string;
  affectedFiles: string[];
  localDependencies: LocalDependencyRef[];
  importChanges: StructuralImportChange[];
  exportChanges: StructuralExportChange[];
  reExportChanges: StructuralExportChange[];
  patchOperations: StructuralPatchOperation[];
  filePatches: { filePath: string; operations: StructuralPatchOperation[] }[];
  fileDiffs?: FilePatchDiff[];
  diffSummary?: DiffSummary;
  warnings: string[];
  blockedReasons: string[];
  impactStatus: StructuralRefactoringStatus;
  riskLevel: RiskLevel;
  planHash: string;
  patchHash: string;
  preimages: Record<string, string>;
  isApplyAllowed: boolean;
}

export interface StructuralRefactoringTransformation {
  planHash: string;
  patchHash: string;
  kind: StructuralRefactoringKind;
  affectedFiles: string[];
  patchOperations: StructuralPatchOperation[];
  filePatches: { filePath: string; operations: StructuralPatchOperation[] }[];
  importChanges: StructuralImportChange[];
  exportChanges: StructuralExportChange[];
  deletedSourceRanges: { filePath: string; startPos: number; endPos: number }[];
  insertedDestinationText?: string;
  preimages: Record<string, string>;
  riskLevel: RiskLevel;
  warnings: string[];
  blockedReasons: string[];
  status: StructuralRefactoringStatus;
  isApplyAllowed: boolean;
}

// ─── Execution Options & Results ───────────────────────────────────────────────

export interface StructuralRefactoringExecutionOptions {
  autoApprove?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
  customBranchName?: string;
}

export interface StructuralRefactoringExecutionResult {
  success: boolean;
  status: StructuralRefactoringStatus;
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
