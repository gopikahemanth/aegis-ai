/**
 * Structural Refactoring Preview Test Suite — Aegis V2.3 Project 2 Phase 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";
import { StructuralRefactoringTransformer } from "../refactoring/structural-refactoring-transformer.js";
import { StructuralRefactoringPreviewEngine } from "../refactoring/structural-refactoring-preview-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("StructuralRefactoringPreviewEngine Tests — Phase 4.3", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;
  let transformer: StructuralRefactoringTransformer;
  let previewEngine: StructuralRefactoringPreviewEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-prev-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, name: string) { return { id, name }; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport function handle() { return updateTask("1", "T"); }\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
    transformer = new StructuralRefactoringTransformer(testDir);
    previewEngine = new StructuralRefactoringPreviewEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1-6: Preview generation is side-effect-free, produces deterministic unified diffs and planHash", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/taskService.ts",
    });

    const transformation = transformer.transform(plan);
    const preview1 = previewEngine.generatePreview(plan, transformation);
    const preview2 = previewEngine.generatePreview(plan, transformation);

    // Determinism
    expect(preview1.planHash).toBe(preview2.planHash);
    expect(preview1.patchHash).toBe(preview2.patchHash);
    expect(preview1.affectedFiles).toEqual(["src/controllers/taskController.ts", "src/services/taskService.ts", "src/utils/taskService.ts"]);
    expect(preview1.fileDiffs.length).toBe(3);
    expect(preview1.impactStatus).toBe("READY");
    expect(preview1.isApplyAllowed).toBe(true);

    // Zero disk mutation
    expect(existsSync(join(testDir, "src", "utils", "taskService.ts"))).toBe(false);
  });
});
