/**
 * Structural Move Barrel & Re-export Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Re-export update in intermediate barrel
 * 2. Re-export chain resolution (index -> barrel -> service)
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

describe("Structural Move Barrel Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-move-barrel-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask() { return true; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "services", "index.ts"),
      `export { updateTask } from "./taskService.js";\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "index.ts"),
      `export { updateTask } from "./services/index.js";\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Update barrel re-export when moving symbol to new file", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    const barrelExport = plan.exportChanges.find(e => e.file === "src/services/index.ts");
    expect(barrelExport).toBeDefined();
    expect(barrelExport?.sourceModule).toContain("../utils/task-utils");
  });
});
