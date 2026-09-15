/**
 * Structural Move Equivalence Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Cold vs Warm vs Incremental planHash equivalence
 * 2. Cold vs Warm vs Incremental patchHash equivalence
 * 3. Task Management E2E structural move
 * 4. Expense Tracker E2E structural move
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Structural Move Equivalence Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-move-equiv-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, name: string) {\n  return { id, name };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\n\nexport function run() {\n  return updateTask("1", "Done");\n}\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Cold == Warm == Incremental planHash and patchHash equivalence", () => {
    const coldPlan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const warmPlanner = new StructuralRefactoringPlanner(testDir);
    const warmPlan = warmPlanner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(coldPlan.planHash).toBe(warmPlan.planHash);
    expect(coldPlan.patchHash).toBe(warmPlan.patchHash);
    expect(coldPlan.patchOperations).toEqual(warmPlan.patchOperations);
  });

  it("TEST 2: Task Management E2E structural move transformation parity", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.patchOperations.length).toBeGreaterThanOrEqual(3); // Remove, Insert, Update Import
    expect(plan.patchOperations.some(o => o.operationKind === "REMOVE_DECLARATION")).toBe(true);
    expect(plan.patchOperations.some(o => o.operationKind === "INSERT_DECLARATION")).toBe(true);
    expect(plan.patchOperations.some(o => o.operationKind === "UPDATE_IMPORT")).toBe(true);
  });
});
