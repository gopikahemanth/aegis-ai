/**
 * Advanced Refactoring Contract — Aegis V2.3 Project 2 Phase 4
 *
 * Types, interfaces, and status codes for safe compound AST refactoring operations:
 * - Function signature changes & parameter addition/removal
 * - React prop addition & removal (with prop drilling & wrapper analysis)
 * - Type/interface field evolution (optional vs required, non-breaking removal)
 * - Function & expression extraction (with free variable & side-effect analysis)
 */

import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";

// ─── Operation Types ───────────────────────────────────────────────────────────

export type AdvancedRefactoringOperation =
  | "FUNCTION_SIGNATURE_CHANGE"
  | "PARAMETER_ADD"
  | "PARAMETER_REMOVE"
  | "REACT_PROP_ADD"
  | "REACT_PROP_REMOVE"
  | "TYPE_FIELD_ADD"
  | "TYPE_FIELD_REMOVE"
  | "EXTRACT_FUNCTION"
  | "EXTRACT_EXPRESSION";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type AdvancedRefactoringStatus =
  | "READY"
  | "BLOCKED"
  | "ANALYSIS_INCOMPLETE"
  | "ADVANCED_REFACTOR_ANALYSIS_INCOMPLETE"
  | "SYMBOL_NOT_FOUND"
  | "SYMBOL_AMBIGUOUS"
  | "SYMBOL_COLLISION"
  | "BREAKING_CHANGE"
  | "DYNAMIC_DEPENDENCY_BLOCKED"
  | "REACT_CONTEXT_ANALYSIS_INCOMPLETE"
  | "EXTRACTION_ANALYSIS_INCOMPLETE"
  | "PLAN_STALE";

// ─── Parameter & Prop & Field Definitions ──────────────────────────────────────

export interface ParameterDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  isOptional?: boolean;
  positionIndex?: number;
}

export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  isOptional?: boolean;
}

export interface FieldDefinition {
  name: string;
  type: string;
  isOptional?: boolean;
  defaultValue?: string;
}

export interface ExtractionRange {
  startPos: number;
  endPos: number;
  extractedName: string;
  targetScope?: string;
  returnType?: string;
  parameters?: string[];
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface AdvancedRefactoringRequest {
  projectPath: string;
  operation: AdvancedRefactoringOperation;
  targetSymbol: string;
  sourceFile: string;
  parameters?: ParameterDefinition[];
  removeParameterName?: string;
  newProps?: PropDefinition[];
  removePropName?: string;
  newFields?: FieldDefinition[];
  removeFieldName?: string;
  extraction?: ExtractionRange;
  planHash?: string;
  preview?: AdvancedRefactoringPreview;
}

export interface AdvancedRefactoringPlan {
  operation: AdvancedRefactoringOperation;
  targetSymbol: string;
  sourceFile: string;
  affectedFiles: string[];
  affectedSymbols: string[];
  requiredCallSites: number;
  requiredComponents: number;
  requiredTests: string[];
  patchOperations: { filePath: string; operations: AstPatchOperation[] }[];
  conflicts: string[];
  riskLevel: RiskLevel;
  blockedReasons: string[];
  planHash: string;
  patchHash: string;
  status: AdvancedRefactoringStatus;
}

export interface AdvancedRefactoringPreview {
  mode: "ADVANCED_REFACTOR";
  operation: AdvancedRefactoringOperation;
  repository: string;
  targetSymbol: string;
  sourceFile: string;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: AdvancedRefactoringStatus;
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

export interface AdvancedRefactoringExecutionResult {
  success: boolean;
  status: AdvancedRefactoringStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
