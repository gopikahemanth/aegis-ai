/**
 * Structural Move Local Dependency Safety Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Detect private local dependency and block with PRIVATE_DEPENDENCY_UNAVAILABLE
 * 2. Allow move when local dependency is exported
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

describe("Structural Move Local Dependency Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-move-dep-");
    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Block move when symbol depends on unexported private function", () => {
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `function validateTask(task: any) { return true; }\n\nexport function updateTask(task: any) {\n  if (validateTask(task)) {\n    return task;\n  }\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("PRIVATE_DEPENDENCY_UNAVAILABLE");
    expect(plan.riskLevel).toBe("BLOCKED");
    expect(plan.isApplyAllowed).toBe(false);
    expect(plan.localDependencies.some(d => d.symbolName === "validateTask" && d.kind === "PRIVATE_UNAVAILABLE")).toBe(true);
  });

  it("TEST 2: Allow move when local dependency is exported", () => {
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function validateTask(task: any) { return true; }\n\nexport function updateTask(task: any) {\n  if (validateTask(task)) {\n    return task;\n  }\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.isApplyAllowed).toBe(true);
  });
});
