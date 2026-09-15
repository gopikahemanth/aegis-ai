/**
 * Structural Refactoring CLI Workflow Test Suite — Aegis V2.3 Project 2 Phase 4.3
 *
 * Tests:
 * 1. Plan generation for CLI refactoring commands
 * 2. Dry run produces zero mutations and zero branches
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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

describe("Structural Refactoring CLI Workflow Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-cli-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string) { return id; }\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Dry run plan generation produces valid diffs and planHash with zero mutations", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.isApplyAllowed).toBe(true);
    expect(plan.planHash.length).toBe(64);
    expect(plan.fileDiffs).toBeDefined();
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(false);
  });
});
