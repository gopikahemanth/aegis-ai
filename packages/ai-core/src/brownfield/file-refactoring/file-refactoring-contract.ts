/**
 * File Refactoring Contract — Aegis V2.3 Project 2 Phase 5
 *
 * Types, interfaces, and status codes for safe file renaming, moving,
 * and repository structure evolution.
 */

import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";

// ─── Operation Types ───────────────────────────────────────────────────────────

export type FileRefactoringOperation =
  | "FILE_RENAME"
  | "FILE_MOVE"
  | "FILE_RENAME_AND_MOVE";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type FileRefactoringStatus =
  | "READY"
  | "BLOCKED"
  | "ANALYSIS_INCOMPLETE"
  | "FILE_REFACTOR_ANALYSIS_INCOMPLETE"
  | "SOURCE_NOT_FOUND"
  | "TARGET_EXISTS"
  | "DYNAMIC_REFERENCE_BLOCKED"
  | "IMPORT_RESOLUTION_INCOMPLETE"
  | "SYMBOL_COLLISION"
  | "CIRCULAR_DEPENDENCY_RISK"
  | "CASE_COLLISION"
  | "PLAN_STALE";

// ─── Reference Information ─────────────────────────────────────────────────────

export interface FileImportReference {
  importerFilePath: string;
  sourceModuleSpecifier: string;
  newModuleSpecifier: string;
  isAliased: boolean;
  isBarrelExport: boolean;
  isSelfInternalImport: boolean; // True if inside the moved file itself pointing out
  startPos: number;
  endPos: number;
  line: number;
  col: number;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface FileRefactoringRequest {
  projectPath: string;
  operation: FileRefactoringOperation;
  sourcePath: string; // Relative path from project root
  targetPath: string; // Relative path from project root
  planHash?: string;
  preview?: FileRefactoringPreview;
}

export interface FileRefactoringPlan {
  operation: FileRefactoringOperation;
  sourcePath: string;
  targetPath: string;
  isCaseOnlyRename: boolean;
  affectedFiles: string[];
  affectedSymbols: string[];
  importReferences: FileImportReference[];
  exportReferences: FileImportReference[];
  testReferences: string[];
  aliasReferences: string[];
  dynamicReferences: string[];
  conflicts: string[];
  riskLevel: RiskLevel;
  blockedReasons: string[];
  filePatches: { filePath: string; operations: AstPatchOperation[] }[];
  planHash: string;
  patchHash: string;
  status: FileRefactoringStatus;
}

export interface FileRefactoringPreview {
  mode: "FILE_REFACTOR";
  operation: FileRefactoringOperation;
  repository: string;
  sourcePath: string;
  targetPath: string;
  isCaseOnlyRename: boolean;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: FileRefactoringStatus;
  riskLevel: RiskLevel;
  requiredFiles: string[];
  mayChangeFiles: string[];
  readOnlyFiles: string[];
  conflicts: string[];
  blockedReasons: string[];
  filePatches: { filePath: string; operations: AstPatchOperation[] }[];
  fileDiffs: FilePatchDiff[];
  diffSummary: DiffSummary;
  isApplyAllowed: boolean;
  preimages: Record<string, string>;
}

export interface FileRefactoringExecutionResult {
  success: boolean;
  status: FileRefactoringStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  sourcePath: string;
  targetPath: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
