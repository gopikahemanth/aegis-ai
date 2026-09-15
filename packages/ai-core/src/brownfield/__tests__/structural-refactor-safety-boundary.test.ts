/**
 * Structural Refactoring Safety Boundary Tests — Aegis V2.3 Project 2 Phase 4
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

describe("Structural Refactoring Safety Boundary Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-safe-");
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calc() { return 1; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent symbol produces SYMBOL_NOT_FOUND and blocked plan", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "missing",
      destinationFile: "src/utils/calc.ts",
    });

    expect(plan.impactStatus).toBe("SYMBOL_NOT_FOUND");
    expect(plan.isApplyAllowed).toBe(false);
  });
});
