/**
 * Structural Refactoring E2E Test Suite — Aegis V2.3 Project 2 Phase 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";
import { StructuralRefactoringTransformer } from "../refactoring/structural-refactoring-transformer.js";
import { StructuralRefactoringPreviewEngine } from "../refactoring/structural-refactoring-preview-engine.js";
import { StructuralRefactoringExecutor } from "../refactoring/structural-refactoring-executor.js";

function makeGitProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  try {
    execSync("git init -b main", { cwd: dir, stdio: "ignore" });
    execSync("git config core.autocrlf false", { cwd: dir, stdio: "ignore" });
    execSync("git config user.name 'Aegis Test'", { cwd: dir, stdio: "ignore" });
    execSync("git config user.email 'test@aegis.dev'", { cwd: dir, stdio: "ignore" });
  } catch {}

  return dir;
}

describe("Structural Refactoring E2E Tests — Phase 4.3", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;
  let transformer: StructuralRefactoringTransformer;
  let previewEngine: StructuralRefactoringPreviewEngine;
  let executor: StructuralRefactoringExecutor;

  beforeEach(() => {
    testDir = makeGitProject("aegis-struct-e2e-");

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

    try {
      execSync("git add . && git commit -m 'initial'", { cwd: testDir, stdio: "ignore" });
    } catch {}

    planner = new StructuralRefactoringPlanner(testDir);
    transformer = new StructuralRefactoringTransformer(testDir);
    previewEngine = new StructuralRefactoringPreviewEngine(testDir);
    executor = new StructuralRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Task Management MOVE_SYMBOL E2E: plan -> preview -> execute -> feature branch commit", async () => {
    const mainHeadBefore = execSync("git rev-parse HEAD", { cwd: testDir, encoding: "utf8" }).trim();

    // 1. Plan
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    // 2. Transform & Preview
    const transformation = transformer.transform(plan);
    const preview = previewEngine.generatePreview(plan, transformation);
    expect(preview.impactStatus).toBe("READY");

    // 3. Execute
    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(true);

    // 4. Verify main HEAD preservation
    const mainHeadAfter = execSync("git rev-parse main", { cwd: testDir, encoding: "utf8" }).trim();
    expect(mainHeadBefore).toBe(mainHeadAfter);

    // 5. Verify destination file exists on feature branch
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(true);
  });

  it("TEST 2: Cold == Warm == Incremental Hash Equivalence", () => {
    const plan1 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const trans1 = transformer.transform(plan1);
    const prev1 = previewEngine.generatePreview(plan1, trans1);

    const plan2 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const trans2 = transformer.transform(plan2);
    const prev2 = previewEngine.generatePreview(plan2, trans2);

    expect(prev1.planHash).toBe(prev2.planHash);
    expect(prev1.patchHash).toBe(prev2.patchHash);
  });
});
