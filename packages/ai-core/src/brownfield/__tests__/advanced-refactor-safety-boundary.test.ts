/**
 * Advanced Refactor Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 5
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

describe("Advanced Refactor Safety Boundary Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-adv-safe-");
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate() { return 10; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Requesting non-existent symbol in multi-move blocks execution", () => {
    const plan = engine.moveSymbols({
      sourceFile: "src/services/calc.ts",
      symbolNames: ["calculate", "nonExistent"],
      destinationFile: "src/utils/calc.ts",
    });

    expect(plan.impactStatus).toBe("SYMBOL_NOT_FOUND");
    expect(plan.isApplyAllowed).toBe(false);
  });
});
