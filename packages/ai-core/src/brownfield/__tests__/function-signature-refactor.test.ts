/**
 * Function Signature Refactoring Test Suite — Aegis V2.3 Project 2 Phase 4
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Function Signature Refactoring Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-fn-sig-");
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate(a: number) { return a * 2; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Adds parameter b: number to calculate signature", () => {
    const plan = engine.transformFunctionSignature("src/services/calc.ts", "calculate", {
      addParam: { name: "b", type: "number", defaultValue: "0" },
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.patchOperations.length).toBe(1);
    expect(plan.patchOperations[0].replacement).toContain("b: number = 0");
  });
});
