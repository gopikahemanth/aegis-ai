/**
 * Dependency Ordering Test Suite — Aegis V2.3 Project 2 Phase 5
 */

import { describe, it, expect } from "vitest";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";
import type { StructuralSymbolIdentity } from "../refactoring/structural-refactoring-contract.js";

describe("Dependency Ordering Tests", () => {
  const engine = new StructuralTransformationEngine(process.cwd());

  it("TEST 1: Topologically orders dependent declarations (C then B then A)", () => {
    const symA: StructuralSymbolIdentity = {
      symbolId: "a",
      name: "fnA",
      kind: "function",
      sourceFile: "src/file.ts",
      declarationStart: 0,
      declarationEnd: 10,
      line: 1,
      column: 1,
      exportStatus: "INTERNAL_EXPORT",
      declarationSnippet: "function fnA() { return fnB(); }",
    };

    const symB: StructuralSymbolIdentity = {
      symbolId: "b",
      name: "fnB",
      kind: "function",
      sourceFile: "src/file.ts",
      declarationStart: 11,
      declarationEnd: 20,
      line: 2,
      column: 1,
      exportStatus: "INTERNAL_EXPORT",
      declarationSnippet: "function fnB() { return fnC(); }",
    };

    const symC: StructuralSymbolIdentity = {
      symbolId: "c",
      name: "fnC",
      kind: "function",
      sourceFile: "src/file.ts",
      declarationStart: 21,
      declarationEnd: 30,
      line: 3,
      column: 1,
      exportStatus: "INTERNAL_EXPORT",
      declarationSnippet: "function fnC() { return 100; }",
    };

    const ordered = engine.topologicalSortDeclarations([symA, symB, symC]);
    const names = ordered.map(s => s.name);

    expect(names.indexOf("fnC")).toBeLessThan(names.indexOf("fnB"));
    expect(names.indexOf("fnB")).toBeLessThan(names.indexOf("fnA"));
  });
});
