/**
 * Refactoring Subsystem — Aegis V2.3 Project 2 Phase 3, Phase 4, Phase 5 & Phase 6
 */

export * from "./symbol-rename-contract.js";
export * from "./symbol-definition-resolver.js";
export * from "./symbol-reference-index.js";
export * from "./rename-conflict-detector.js";
export * from "./rename-impact-analyzer.js";
export * from "./ast-symbol-rename-planner.js";
export * from "./rename-preview-engine.js";
export * from "./rename-preview.js";
export * from "./symbol-rename-executor.js";

// Phase 4 & Phase 5: Structural Refactoring & Transformations
export * from "./structural-refactoring-contract.js";
export * from "./structural-refactoring-planner.js";
export * from "./structural-refactoring-transformer.js";
export * from "./structural-refactoring-preview-engine.js";
export * from "./final-execution-gate.js";
export { StructuralFinalSuccessGate } from "./final-success-gate.js";
export * from "./structural-refactoring-executor.js";
export * from "./structural-transformation-engine.js";

// Phase 6: Semantic Verification & Validation Gates
export * from "./semantic-verification-contract.js";
export * from "./public-api-compatibility-verifier.js";
export * from "./refactoring-validation-runner.js";
export * from "./semantic-refactoring-verifier.js";

// Advanced AST Refactoring Planners
export * from "./advanced-refactoring-contract.js";
export * from "./signature-change-planner.js";
export * from "./parameter-change-analyzer.js";
export * from "./react-prop-refactoring-planner.js";
export * from "./type-field-refactoring-planner.js";
export * from "./function-extraction-planner.js";
export * from "./refactoring-conflict-analyzer.js";
export * from "./advanced-refactoring-preview.js";
export * from "./advanced-refactoring-executor.js";
