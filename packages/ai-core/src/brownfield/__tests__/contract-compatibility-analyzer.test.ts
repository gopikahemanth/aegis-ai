/**
 * ContractCompatibilityAnalyzer Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Deterministic compatibility classification
 * - Blocker detection on missing default values
 */

import { describe, it, expect } from "vitest";
import { ContractCompatibilityAnalyzer } from "../contract-refactoring/contract-compatibility-analyzer.js";
import type { ContractDefinition } from "../contract-refactoring/contract-refactoring-contract.js";

describe("ContractCompatibilityAnalyzer Tests", () => {
  const analyzer = new ContractCompatibilityAnalyzer();

  const dummyContract: ContractDefinition = {
    symbolId: "src/service.ts#update",
    contractId: "c_1",
    filePath: "src/service.ts",
    symbolName: "update",
    kind: "function",
    startPos: 0,
    endPos: 10,
  };

  it("TEST 1: Classifies parameter addition with default as CONDITIONALLY_COMPATIBLE", () => {
    const res = analyzer.analyze(
      {
        projectPath: ".",
        operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
        sourceFile: "src/service.ts",
        targetSymbol: "update",
        parameters: [{ name: "opt", type: "string", defaultValue: '"val"' }],
      },
      dummyContract
    );

    expect(res.compatibility).toBe("CONDITIONALLY_COMPATIBLE");
    expect(res.isSafe).toBe(true);
    expect(res.status).toBe("READY");
  });

  it("TEST 2: Blocks required parameter addition without default value as BREAKING", () => {
    const res = analyzer.analyze(
      {
        projectPath: ".",
        operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
        sourceFile: "src/service.ts",
        targetSymbol: "update",
        parameters: [{ name: "requiredOpt", type: "string" }],
      },
      dummyContract
    );

    expect(res.compatibility).toBe("BREAKING");
    expect(res.isSafe).toBe(false);
    expect(res.status).toBe("CONTRACT_CHANGE_BLOCKED");
  });
});
