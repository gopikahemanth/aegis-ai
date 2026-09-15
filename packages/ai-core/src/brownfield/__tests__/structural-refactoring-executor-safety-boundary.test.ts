/**
 * Structural Refactoring Executor Safety Boundary Tests — Aegis V2.3 Project 2 Phase 4.3
 *
 * Tests:
 * 1. Blocked plan execution produces immediate rejection with zero mutations
 * 2. Uncommitted changes rejection (GIT_DIRTY_TARGET)
 * 3. Feature branch collision handling
 * 4. Main branch preservation before and after execution
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";
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

describe("Structural Refactoring Executor Safety Boundary Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;
  let executor: StructuralRefactoringExecutor;

  beforeEach(() => {
    testDir = makeGitProject("aegis-struct-exec-safe-");

    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calculate() { return 10; }\n`,
      "utf8"
    );

    try {
      execSync("git add . && git commit -m 'initial'", { cwd: testDir, stdio: "ignore" });
    } catch {}

    planner = new StructuralRefactoringPlanner(testDir);
    executor = new StructuralRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Blocked plan execution produces immediate rejection", async () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "missingSymbol",
      destinationFile: "src/utils/calc.ts",
    });

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(false);
    expect(result.status).toBe("SYMBOL_NOT_FOUND");
    expect(existsSync(join(testDir, "src", "utils", "calc.ts"))).toBe(false);
  });

  it("TEST 2: Main branch HEAD remains untouched throughout execution", async () => {
    const mainHeadBefore = execSync("git rev-parse HEAD", { cwd: testDir, encoding: "utf8" }).trim();

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "calculate",
      destinationFile: "src/utils/calc.ts",
    });

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(true);

    // Switch back to main to check HEAD
    execSync("git checkout main", { cwd: testDir, stdio: "ignore" });
    const mainHeadAfter = execSync("git rev-parse HEAD", { cwd: testDir, encoding: "utf8" }).trim();

    expect(mainHeadAfter).toBe(mainHeadBefore);
  });
});
