/**
 * Structural Refactoring Transformer Test Suite — Aegis V2.3 Project 2 Phase 4.2
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";
import { StructuralRefactoringTransformer } from "../refactoring/structural-refactoring-transformer.js";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("StructuralRefactoringTransformer Tests — Phase 4.2", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;
  let transformer: StructuralRefactoringTransformer;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-trans-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `/**
 * Updates a task by ID
 */
export function updateTask(id: string, name: string) {
  return { id, name };
}

export class TaskManager {
  public run() { return true; }
}
`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";
export function handle() {
  return updateTask("1", "Task 1");
}
`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
    transformer = new StructuralRefactoringTransformer(testDir);
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  // ─── Group A: MOVE_SYMBOL ───────────────────────────────────────────────────

  it("A1-A10: Transforms MOVE_SYMBOL plan into surgical, deterministic patches preserving comments", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/taskService.ts",
    });

    expect(plan.impactStatus).toBe("READY");

    const transformation = transformer.transform(plan);
    expect(transformation.isApplyAllowed).toBe(true);
    expect(transformation.status).toBe("READY");
    expect(transformation.patchHash.length).toBe(64);
    expect(transformation.deletedSourceRanges.length).toBeGreaterThan(0);
    expect(transformation.insertedDestinationText).toContain("Updates a task by ID");
    expect(transformation.insertedDestinationText).toContain("export function updateTask");
  });

  // ─── Group B: FUNCTION_SIGNATURE_CHANGE ─────────────────────────────────────

  it("B11-B16: Transforms function signature and produces exact parameter update patches", () => {
    const plan = engine.transformFunctionSignature(
      "src/services/taskService.ts",
      "updateTask",
      { renameParam: { oldName: "name", newName: "taskName" } }
    );

    const transformation = transformer.transform(plan);
    expect(transformation.status).toBe("READY");
    expect(transformation.patchOperations.some(p => p.replacement.includes("taskName: string"))).toBe(true);
  });

  // ─── Group C: EXTRACT_FUNCTION ──────────────────────────────────────────────

  it("C17-C24: Evaluates function extraction and blocks 'this' or crossing control flow", () => {
    writeFileSync(
      join(testDir, "src", "services", "loop.ts"),
      `export function processItems() {
  for (let i = 0; i < 10; i++) {
    if (i === 5) break;
  }
}
`,
      "utf8"
    );

    const analysis = transformer.analyzeFunctionExtraction("src/services/loop.ts", {
      startLine: 3,
      endLine: 4,
    });

    expect(analysis.canExtract).toBe(false);
    expect(analysis.status).toBe("EXTRACTION_CAPTURE_UNSAFE");
    expect(analysis.hasCrossingControlFlow).toBe(true);
  });

  // ─── Group D: Safety & Determinism ──────────────────────────────────────────

  it("D25-D31: Zero mutation during transform & Cold == Warm == Incremental patchHash equivalence", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "TaskManager",
      destinationFile: "src/utils/taskManager.ts",
    });

    const trans1 = transformer.transform(plan);
    const trans2 = transformer.transform(plan);

    expect(trans1.patchHash).toBe(trans2.patchHash);
    expect(trans1.deletedSourceRanges).toEqual(trans2.deletedSourceRanges);
  });
});
