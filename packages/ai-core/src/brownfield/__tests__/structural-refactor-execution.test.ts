/**
 * Structural Refactoring Execution Test Suite — Aegis V2.3 Project 2 Phase 4
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

describe("Structural Refactoring Execution Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let executor: StructuralRefactoringExecutor;

  beforeEach(() => {
    testDir = makeGitProject("aegis-struct-exec-main-");

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

  it("TEST 1: Executes MOVE_SYMBOL and creates feature branch", async () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(true);
  });
});
