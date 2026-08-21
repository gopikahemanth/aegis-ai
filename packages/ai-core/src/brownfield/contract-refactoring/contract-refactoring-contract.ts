/**
 * Contract Refactoring Contract — Aegis V2.3 Project 2 Phase 6
 *
 * Types, interfaces, and status codes for safe cross-file contract,
 * DTO, API client, service, and hook boundary refactoring.
 */

import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";

// ─── Operation Types ───────────────────────────────────────────────────────────

export type ContractRefactoringOperation =
  | "EXPORTED_FUNCTION_PARAMETER_ADD"
  | "EXPORTED_FUNCTION_PARAMETER_REMOVE"
  | "EXPORTED_FUNCTION_RETURN_CHANGE"
  | "INTERFACE_FIELD_ADD"
  | "INTERFACE_FIELD_REMOVE"
  | "INTERFACE_FIELD_RENAME"
  | "DTO_FIELD_ADD"
  | "DTO_FIELD_REMOVE"
  | "DTO_FIELD_RENAME"
  | "SERVICE_CONTRACT_CHANGE"
  | "API_CLIENT_CONTRACT_CHANGE"
  | "HOOK_RETURN_CONTRACT_CHANGE"
  | "COMPONENT_PUBLIC_PROP_CHANGE";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type ContractRefactoringStatus =
  | "READY"
  | "BLOCKED"
  | "ANALYSIS_INCOMPLETE"
  | "CONTRACT_ANALYSIS_INCOMPLETE"
  | "CONTRACT_NOT_FOUND"
  | "CONTRACT_CHANGE_BLOCKED"
  | "BREAKING_CONTRACT_CHANGE"
  | "DTO_PROPAGATION_INCOMPLETE"
  | "SERVICE_IMPLEMENTATION_AMBIGUOUS"
  | "NEW_CIRCULAR_DEPENDENCY"
  | "DYNAMIC_REFERENCE_BLOCKED"
  | "SYMBOL_COLLISION"
  | "PLAN_STALE";

export type CompatibilityClassification =
  | "NON_BREAKING"
  | "CONDITIONALLY_COMPATIBLE"
  | "BREAKING"
  | "UNKNOWN";

export type ConsumerClassification =
  | "MUST_CHANGE"
  | "MAY_CHANGE"
  | "READ_ONLY"
  | "PROTECTED";

// ─── Contract Descriptors ──────────────────────────────────────────────────────

export interface ContractDefinition {
  symbolId: string;
  contractId: string;
  filePath: string;
  symbolName: string;
  kind: "function" | "interface" | "type" | "service" | "dto" | "api_client" | "hook" | "component";
  signature?: string;
  returnType?: string;
  fields?: { name: string; type: string; isOptional?: boolean }[];
  parameters?: { name: string; type: string; defaultValue?: string; isOptional?: boolean }[];
  startPos: number;
  endPos: number;
}

export interface ContractConsumer {
  filePath: string;
  symbolName: string;
  classification: ConsumerClassification;
  usageType: "call" | "property_access" | "destructuring" | "type_reference" | "jsx" | "hook_call" | "import" | "test";
  startPos: number;
  endPos: number;
  line: number;
  col: number;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface ContractRefactoringRequest {
  projectPath: string;
  operation: ContractRefactoringOperation;
  sourceFile: string;
  targetSymbol: string;
  // Parameter changes
  parameters?: { name: string; type: string; defaultValue?: string; isOptional?: boolean }[];
  removeParameterName?: string;
  // Field changes
  newFields?: { name: string; type: string; defaultValue?: string; isOptional?: boolean }[];
  removeFieldName?: string;
  renameField?: { oldName: string; newName: string };
  // Return / DTO changes
  newReturnType?: string;
  planHash?: string;
  preview?: ContractRefactoringPreview;
}

export interface ContractRefactoringPlan {
  operation: ContractRefactoringOperation;
  targetSymbol: string;
  sourceFile: string;
  contract: ContractDefinition;
  consumers: ContractConsumer[];
  affectedFiles: string[];
  affectedSymbols: string[];
  compatibility: CompatibilityClassification;
  riskLevel: RiskLevel;
  conflicts: string[];
  blockedReasons: string[];
  patchOperations: { filePath: string; operations: AstPatchOperation[] }[];
  planHash: string;
  patchHash: string;
  status: ContractRefactoringStatus;
}

export interface ContractRefactoringPreview {
  mode: "CONTRACT_REFACTOR";
  operation: ContractRefactoringOperation;
  repository: string;
  targetSymbol: string;
  sourceFile: string;
  branchName: string;
  compatibility: CompatibilityClassification;
  planHash: string;
  patchHash: string;
  status: ContractRefactoringStatus;
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

export interface ContractRefactoringExecutionResult {
  success: boolean;
  status: ContractRefactoringStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
