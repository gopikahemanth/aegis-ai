/**
 * Symbol Rename Contract — Aegis V2.3 Project 2 Phase 3
 *
 * Types, interfaces, and status codes for safe, AST-aware symbol renaming and refactoring.
 */

import type { SymbolKind } from "../symbol-reference-resolver.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../patch-preview-engine.js";

// ─── Rename Status Codes ───────────────────────────────────────────────────────

export type SymbolRenameStatus =
  | "READY"
  | "BLOCKED"
  | "RENAME_ANALYSIS_INCOMPLETE"
  | "SYMBOL_NOT_FOUND"
  | "SYMBOL_AMBIGUOUS"
  | "SYMBOL_COLLISION"
  | "PRISMA_MODEL_RENAME_BLOCKED"
  | "DYNAMIC_DEPENDENCY_BLOCKED"
  | "UNRESOLVED_REFERENCE_BLOCKED"
  | "SCOPE_SHADOWING_BLOCKED"
  | "PLAN_STALE";

// ─── Reference Classification ──────────────────────────────────────────────────

export type SymbolReferenceKind =
  | "DEFINITION"
  | "CALL_EXPRESSION"
  | "IDENTIFIER_USAGE"
  | "TYPE_REFERENCE"
  | "HERITAGE_CLAUSE" // extends / implements
  | "NEW_EXPRESSION"
  | "JSX_ELEMENT" // <Component /> / </Component>
  | "NAMED_IMPORT"
  | "ALIASED_IMPORT"
  | "DEFAULT_IMPORT"
  | "NAMESPACE_MEMBER_ACCESS" // utils.foo
  | "NAMED_EXPORT"
  | "ALIASED_EXPORT"
  | "BARREL_RE_EXPORT"
  | "TEST_ASSERTION_USAGE";

export interface SymbolReferenceLocation {
  filePath: string;
  kind: SymbolReferenceKind;
  startPos: number;
  endPos: number;
  line: number;
  col: number;
  matchedText: string;
  replacementText: string;
  scopeId: string;
  isAliased?: boolean;
  aliasName?: string;
  importedFromModule?: string;
}

export interface ResolvedSymbolDefinition {
  symbolId: string;
  filePath: string;
  name: string;
  kind: SymbolKind;
  isExported: boolean;
  isDefaultExport: boolean;
  startPos: number;
  endPos: number;
  nameStartPos: number;
  nameEndPos: number;
  line: number;
  col: number;
  scopeId: string;
  containerName?: string;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface SymbolRenameRequest {
  projectPath: string;
  sourceFile: string;
  symbolName: string;
  symbolKind?: SymbolKind;
  newName: string;
  planHash?: string;
  preview?: RenamePreview;
}

export interface SymbolRenamePlan {
  sourceSymbol: ResolvedSymbolDefinition;
  targetName: string;
  definitionFiles: string[];
  referenceFiles: string[];
  affectedSymbols: string[];
  requiredFiles: string[];
  references: SymbolReferenceLocation[];
  conflicts: string[];
  blockedReasons: string[];
  patches: { filePath: string; operations: AstPatchOperation[] }[];
  planHash: string;
  patchHash: string;
  status: SymbolRenameStatus;
}

export interface RenamePreview {
  mode: "BROWNFIELD_REFACTOR";
  repository: string;
  sourceFile: string;
  symbolName: string;
  symbolKind: SymbolKind;
  newName: string;
  slug: string;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: SymbolRenameStatus;
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
  preimages: Record<string, string>; // filePath -> SHA-256
}

export interface SymbolRenameExecutionResult {
  success: boolean;
  status: SymbolRenameStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}
