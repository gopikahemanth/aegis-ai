/**
 * StructuralRefactoringExecutor Test Suite — Aegis V2.3 Project 2 Phase 4.3
 *
 * Tests:
 * 1. Successful MOVE_SYMBOL execution across multiple files
 * 2. Preimage validation and stale plan rejection
 * 3. Feature branch creation & isolation
 * 4. Post-apply structural verification
 * 5. Atomic rollback on failure
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";
import { StructuralRefactoringExecutor } from "../refactoring/structural-refactoring-executor.js";

function makeGitProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  // Init git repo
  try {
    execSync("git init -b main", { cwd: dir, stdio: "ignore" });
    execSync("git config core.autocrlf false", { cwd: dir, stdio: "ignore" });
    execSync("git config user.name 'Aegis Test'", { cwd: dir, stdio: "ignore" });
    execSync("git config user.email 'test@aegis.dev'", { cwd: dir, stdio: "ignore" });
  } catch {}

  return dir;
}

describe("StructuralRefactoringExecutor Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;
  let executor: StructuralRefactoringExecutor;

  beforeEach(() => {
    testDir = makeGitProject("aegis-struct-exec-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, name: string) { return { id, name }; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport function handleUpdate() { return updateTask("1", "New"); }\n`,
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

  it("TEST 1: Successful MOVE_SYMBOL execution updates source, destination, and consumer", async () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");

    // Verify destination contains moved function
    const destContent = readFileSync(join(testDir, "src", "utils", "task-utils.ts"), "utf8");
    expect(destContent).toContain("export function updateTask");

    // Verify source no longer contains function
    const srcContent = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");
    expect(srcContent).not.toContain("export function updateTask");

    // Verify consumer import is updated
    const ctrlContent = readFileSync(join(testDir, "src", "controllers", "taskController.ts"), "utf8");
    expect(ctrlContent).toContain("../utils/task-utils");
  });

  it("TEST 2: Stale preimage rejection halts before modifying files", async () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    // Modify file on disk to simulate drift
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, name: string) { return "drifted"; }\n`,
      "utf8"
    );

    const result = await executor.execute(plan, { skipTests: true, skipBuild: true });
    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(false);
  });
});
