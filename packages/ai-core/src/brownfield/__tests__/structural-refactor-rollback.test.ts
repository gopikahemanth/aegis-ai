/**
 * Structural Refactoring Rollback Tests — Aegis V2.3 Project 2 Phase 4
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";
import { StructuralRefactoringExecutor } from "../refactoring/structural-refactoring-executor.js";

function makeGitProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
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

describe("Structural Refactoring Rollback Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let executor: StructuralRefactoringExecutor;

  beforeEach(() => {
    testDir = makeGitProject("aegis-rollback-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string) { return id; }\n`,
      "utf8"
    );

    try {
      execSync("git add . && git commit -m 'initial'", { cwd: testDir, stdio: "ignore" });
    } catch {}

    engine = new StructuralTransformationEngine(testDir);
    executor = new StructuralRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Rollback restores original file bytes when disk drift occurs", async () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const originalContent = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");

    // Mutate file to cause preimage mismatch
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask() { return "mutated"; }\n`,
      "utf8"
    );

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(false);
  });
});
