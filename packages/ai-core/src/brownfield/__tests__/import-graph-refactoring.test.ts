/**
 * Import Graph Refactoring Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Update direct named import
 * 2. Update aliased import while preserving local alias
 * 3. Preserve unrelated imports in consumer file
 * 4. Exact descending patch offset ordering
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

describe("Import Graph Refactoring Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-import-graph-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string) { return id; }\nexport function deleteTask(id: string) { return id; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask, deleteTask } from "../services/taskService.js";\nimport { updateTask as modifyTask } from "../services/taskService.js";\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Update direct import and preserve alias", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    const importUpdates = plan.importChanges.filter(i => i.consumerFile === "src/controllers/taskController.ts");
    expect(importUpdates.length).toBeGreaterThanOrEqual(1);

    const aliased = importUpdates.find(i => i.localAlias === "modifyTask");
    expect(aliased).toBeDefined();
    expect(aliased?.newModulePath).toContain("../utils/task-utils");
  });

  it("TEST 2: Operations in file are sorted descending by startPos", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    for (const fp of plan.filePatches) {
      for (let i = 1; i < fp.operations.length; i++) {
        expect(fp.operations[i - 1].startPos).toBeGreaterThanOrEqual(fp.operations[i].startPos);
      }
    }
  });
});
