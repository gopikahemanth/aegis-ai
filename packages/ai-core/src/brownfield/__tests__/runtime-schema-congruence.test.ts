/**
 * RuntimeSchemaCongruence Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - IN_SYNC congruence between TypeScript interface and Zod schema
 * - RUNTIME_CONTRACT_DIVERGENCE detection on field type mismatch
 * - UNRESOLVED_SCHEMA_COERCION detection on dynamic coercions
 */

import { describe, it, expect } from "vitest";
import { RuntimeContractCongruenceEngine } from "../runtime-contract/runtime-contract-congruence.js";
import type { ContractDefinition } from "../contract-refactoring/contract-refactoring-contract.js";
import type { RuntimeSchemaDefinition } from "../runtime-contract/runtime-contract-model.js";

describe("RuntimeContractCongruenceEngine Tests", () => {
  const engine = new RuntimeContractCongruenceEngine();

  it("TEST 1: Evaluates IN_SYNC when TypeScript interface matches Zod schema exactly", () => {
    const contract: ContractDefinition = {
      symbolId: "src/types.ts#Task",
      contractId: "c_task",
      filePath: "src/types.ts",
      symbolName: "Task",
      kind: "interface",
      fields: [
        { name: "id", type: "string" },
        { name: "title", type: "string" },
        { name: "priority", type: "string", isOptional: true },
      ],
      startPos: 0,
      endPos: 100,
    };

    const schema: RuntimeSchemaDefinition = {
      schemaId: "src/schemas.ts#TaskSchema",
      schemaName: "TaskSchema",
      filePath: "src/schemas.ts",
      validatorType: "zod",
      fields: [
        { name: "id", type: "string", rawTypeString: "z.string()", isOptional: false, isNullable: false, startPos: 0, endPos: 10 },
        { name: "title", type: "string", rawTypeString: "z.string()", isOptional: false, isNullable: false, startPos: 11, endPos: 20 },
        { name: "priority", type: "string", rawTypeString: "z.string().optional()", isOptional: true, isNullable: false, startPos: 21, endPos: 35 },
      ],
      startPos: 0,
      endPos: 100,
    };

    const res = engine.evaluate(contract, schema);
    expect(res.isCongruent).toBe(true);
    expect(res.status).toBe("IN_SYNC");
  });

  it("TEST 2: Detects RUNTIME_CONTRACT_DIVERGENCE when field types mismatch", () => {
    const contract: ContractDefinition = {
      symbolId: "src/types.ts#Task",
      contractId: "c_task",
      filePath: "src/types.ts",
      symbolName: "Task",
      kind: "interface",
      fields: [
        { name: "priority", type: "number" }, // TS says number
      ],
      startPos: 0,
      endPos: 100,
    };

    const schema: RuntimeSchemaDefinition = {
      schemaId: "src/schemas.ts#TaskSchema",
      schemaName: "TaskSchema",
      filePath: "src/schemas.ts",
      validatorType: "zod",
      fields: [
        { name: "priority", type: "string", rawTypeString: "z.string()", isOptional: false, isNullable: false, startPos: 0, endPos: 10 }, // Zod says string
      ],
      startPos: 0,
      endPos: 100,
    };

    const res = engine.evaluate(contract, schema);
    expect(res.isCongruent).toBe(false);
    expect(res.status).toBe("RUNTIME_CONTRACT_DIVERGENCE");
  });

  it("TEST 3: Flags UNRESOLVED_SCHEMA_COERCION when z.coerce or transforms are used", () => {
    const contract: ContractDefinition = {
      symbolId: "src/types.ts#Task",
      contractId: "c_task",
      filePath: "src/types.ts",
      symbolName: "Task",
      kind: "interface",
      fields: [{ name: "id", type: "string" }],
      startPos: 0,
      endPos: 100,
    };

    const schema: RuntimeSchemaDefinition = {
      schemaId: "src/schemas.ts#TaskSchema",
      schemaName: "TaskSchema",
      filePath: "src/schemas.ts",
      validatorType: "zod",
      fields: [
        { name: "id", type: "string", rawTypeString: "z.coerce.string()", isOptional: false, isNullable: false, hasCoercion: true, startPos: 0, endPos: 10 },
      ],
      startPos: 0,
      endPos: 100,
    };

    const res = engine.evaluate(contract, schema);
    expect(res.isCongruent).toBe(false);
    expect(res.status).toBe("UNRESOLVED_SCHEMA_COERCION");
  });
});
