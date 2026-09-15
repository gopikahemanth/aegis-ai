/**
 * Semantic Verification Contract — Aegis V2.3 Project 2 Phase 6
 *
 * Types, interfaces, and status codes for pre-execution semantic verification of refactorings:
 * - In-memory AST syntax and structural validity
 * - Import and export resolution & cycle safety
 * - Symbol reference closure & scope consistency
 * - Public API compatibility gate
 * - Type contract validation
 * - Deterministic verificationHash
 */

export type SemanticVerificationStatus =
  | "PASSED"
  | "FAILED"
  | "INCOMPLETE"
  | "AST_PARSE_ERROR"
  | "UNRESOLVED_IMPORT"
  | "UNRESOLVED_EXPORT"
  | "UNRESOLVED_SYMBOL"
  | "DUPLICATE_DECLARATION"
  | "DEPENDENCY_GRAPH_INVALID"
  | "PUBLIC_API_BREAK"
  | "TYPE_CONTRACT_BREAK"
  | "TEST_REGRESSION"
  | "BUILD_REGRESSION"
  | "DYNAMIC_DEPENDENCY_BLOCKED";

export interface SemanticVerificationResult {
  status: SemanticVerificationStatus;
  passed: boolean;
  errors: string[];
  warnings: string[];
  affectedFiles: string[];
  unresolvedSymbols: string[];
  unresolvedImports: string[];
  unresolvedExports: string[];
  duplicateSymbols: string[];
  publicApiChanges: string[];
  dependencyGraphChanges: string[];
  typeContractChanges: string[];
  testResult?: { passed: boolean; message?: string };
  buildResult?: { passed: boolean; message?: string };
  verificationHash: string;
}

export interface SemanticVerificationOptions {
  skipTests?: boolean;
  skipBuild?: boolean;
  allowPublicApiBreak?: boolean;
}
