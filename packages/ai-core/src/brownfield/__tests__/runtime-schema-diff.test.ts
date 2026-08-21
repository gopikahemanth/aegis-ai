/**
 * RuntimeSchemaDiffEngine Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - Structural field diff computation: ADD, REMOVE, RENAME
 */

import { describe, it, expect } from "vitest";
import { RuntimeSchemaDiffEngine } from "../runtime-contract/runtime-schema-diff-engine.js";

describe("RuntimeSchemaDiffEngine Tests", () => {
  it("TEST 1: Computes ADD field diff", () => {
    const diffs = RuntimeSchemaDiffEngine.computeDiff([], "SCHEMA_FIELD_ADD", {
      newField: { name: "priority", type: "string" },
    });

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("ADD");
    expect(diffs[0].fieldName).toBe("priority");
  });

  it("TEST 2: Computes RENAME field diff", () => {
    const diffs = RuntimeSchemaDiffEngine.computeDiff([], "SCHEMA_FIELD_RENAME", {
      renameField: { oldName: "category", newName: "expenseCategory" },
    });

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("RENAME");
    expect(diffs[0].fieldName).toBe("category");
    expect(diffs[0].newFieldName).toBe("expenseCategory");
  });
});
