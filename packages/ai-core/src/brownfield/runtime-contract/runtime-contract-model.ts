/**
 * Runtime Contract Model — Aegis V2.3 Project 2 Phase 7.1
 *
 * Types, interfaces, and status codes for runtime schema synchronization (Zod, Yup, Joi)
 * and TypeScript contract congruence.
 */

import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type RuntimeCongruenceStatus =
  | "IN_SYNC"
  | "RUNTIME_CONTRACT_DIVERGENCE"
  | "UNRESOLVED_SCHEMA_COERCION"
  | "SCHEMA_NOT_FOUND"
  | "UNSUPPORTED_SCHEMA_CONSTRUCT"
  | "SCHEMA_COMPOSITION_UNRESOLVED"
  | "RUNTIME_VALIDATION_LOGIC_UNVERIFIED"
  | "OPENAPI_CONTRACT_DIVERGENCE";

export type RuntimeContractOperation =
  | "SCHEMA_FIELD_ADD"
  | "SCHEMA_FIELD_REMOVE"
  | "SCHEMA_FIELD_RENAME"
  | "SCHEMA_TYPE_CHANGE"
  | "SCHEMA_ENUM_UPDATE";

export type RuntimeContractStatus =
  | "READY"
  | "BLOCKED"
  | "ANALYSIS_INCOMPLETE"
  | "RUNTIME_CONTRACT_DIVERGENCE"
  | "UNRESOLVED_SCHEMA_COERCION"
  | "SCHEMA_NOT_FOUND"
  | "CONTRACT_CHANGE_BLOCKED"
  | "BREAKING_CONTRACT_CHANGE"
  | "PLAN_STALE";

// ─── Schema Descriptors ────────────────────────────────────────────────────────

export interface SchemaFieldDescriptor {
  name: string;
  type: string; // "string" | "number" | "boolean" | "date" | "enum" | "array" | "object" | "unknown"
  rawTypeString: string;
  isOptional: boolean;
  isNullable: boolean;
  enumValues?: string[];
  elementSchema?: SchemaFieldDescriptor;
  nestedFields?: SchemaFieldDescriptor[];
  hasCoercion?: boolean;
  hasTransform?: boolean;
  hasRefinement?: boolean;
  startPos: number;
  endPos: number;
}

export interface RuntimeSchemaDefinition {
  schemaId: string;
  schemaName: string;
  filePath: string;
  validatorType: "zod" | "yup" | "joi" | "class-validator";
  inferredTypeName?: string;
  isComposition?: boolean; // extend, pick, omit
  fields: SchemaFieldDescriptor[];
  startPos: number;
  endPos: number;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface RuntimeContractRequest {
  projectPath: string;
  operation: RuntimeContractOperation;
  sourceFile: string;
  targetSymbol: string; // Interface or Schema name
  schemaName?: string;
  newField?: {
    name: string;
    type: string;
    zodTypeString?: string;
    isOptional?: boolean;
    isNullable?: boolean;
    defaultValue?: string;
  };
  removeFieldName?: string;
  renameField?: {
    oldName: string;
    newName: string;
  };
  planHash?: string;
  preview?: RuntimeContractPreview;
}

export interface RuntimeContractPlan {
  operation: RuntimeContractOperation;
  sourceFile: string;
  targetSymbol: string;
  schemaName: string;
  congruence: RuntimeCongruenceStatus;
  affectedFiles: string[];
  patchOperations: { filePath: string; operations: AstPatchOperation[] }[];
  riskLevel: RiskLevel;
  conflicts: string[];
  blockedReasons: string[];
  planHash: string;
  patchHash: string;
  status: RuntimeContractStatus;
}

export interface RuntimeContractPreview {
  mode: "RUNTIME_CONTRACT_REFACTOR";
  operation: RuntimeContractOperation;
  repository: string;
  targetSymbol: string;
  sourceFile: string;
  schemaName: string;
  congruence: RuntimeCongruenceStatus;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: RuntimeContractStatus;
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

export interface RuntimeContractExecutionResult {
  success: boolean;
  status: RuntimeContractStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
