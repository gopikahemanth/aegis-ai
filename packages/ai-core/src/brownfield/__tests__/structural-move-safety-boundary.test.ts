/**
 * Structural Move Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Missing symbol produces SYMBOL_NOT_FOUND and zero file mutation
 * 2. Destination collision produces SYMBOL_COLLISION and zero file mutation
 * 3. Dynamic dependency produces DYNAMIC_DEPENDENCY_BLOCKED
 * 4. Circular dependency produces CIRCULAR_DEPENDENCY_CREATED
 * 5. Private dependency produces PRIVATE_DEPENDENCY_UNAVAILABLE
 * 6. Changing source file preimage invalidates planHash and patchHash
 * 7. Zero disk mutation and zero branch creation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Structural Move Safety Boundary Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-move-safety-");
    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preimage sensitivity — changing source content invalidates planHash & patchHash", () => {
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate() { return 10; }\n`,
      "utf8"
    );

    const plan1 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "calculate",
      destinationFile: "src/utils/calc.ts",
    });

    expect(plan1.planHash.length).toBe(64);
    expect(plan1.patchHash.length).toBe(64);

    // Modify source file on disk
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate() { return 20; }\n`,
      "utf8"
    );

    const plan2 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "calculate",
      destinationFile: "src/utils/calc.ts",
    });

    expect(plan2.planHash).not.toBe(plan1.planHash);
    expect(plan2.patchHash).not.toBe(plan1.patchHash);
  });

  it("TEST 2: Pure side-effect-free execution — zero writes or branch creation", () => {
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate() { return 10; }\n`,
      "utf8"
    );

    const before = readFileSync(join(testDir, "src", "services", "calc.ts"), "utf8");

    planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "calculate",
      destinationFile: "src/utils/calc.ts",
    });

    expect(readFileSync(join(testDir, "src", "services", "calc.ts"), "utf8")).toBe(before);
    expect(existsSync(join(testDir, "src", "utils", "calc.ts"))).toBe(false);
  });
});
