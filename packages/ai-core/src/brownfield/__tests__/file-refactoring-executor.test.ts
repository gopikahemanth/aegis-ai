/**
 * FileRefactoringExecutor Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Transactional execution of FILE_RENAME
 * - Transactional execution of FILE_MOVE
 * - Windows case-only rename safety
 * - Rollback on blocked status
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileRefactoringExecutor } from "../file-refactoring/file-refactoring-executor.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("FileRefactoringExecutor Tests", () => {
  let testDir: string;
  let executor: FileRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-file-exec-");

    writeFileSync(
      join(testDir, "src", "utils", "format.ts"),
      `export function format(s: string) { return s; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "TaskCard.tsx"),
      `import { format } from "../utils/format.js";\nexport function TaskCard() { return format("Card"); }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "TaskList.tsx"),
      `import { TaskCard } from "./TaskCard.js";\nexport function TaskList() { return TaskCard(); }\n`,
      "utf8"
    );

    executor = new FileRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Executes FILE_RENAME and updates caller import statements", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/components/TaskItem.tsx",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");

    expect(existsSync(join(testDir, "src", "components", "TaskCard.tsx"))).toBe(false);
    expect(existsSync(join(testDir, "src", "components", "TaskItem.tsx"))).toBe(true);

    const callerContent = readFileSync(join(testDir, "src", "components", "TaskList.tsx"), "utf8");
    expect(callerContent).toContain('import { TaskCard } from "./TaskItem.js"');
  });

  it("TEST 2: Executes FILE_MOVE and updates both caller and moved file internal imports", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_MOVE",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/features/tasks/TaskCard.tsx",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");

    expect(existsSync(join(testDir, "src", "components", "TaskCard.tsx"))).toBe(false);
    expect(existsSync(join(testDir, "src", "features", "tasks", "TaskCard.tsx"))).toBe(true);

    const callerContent = readFileSync(join(testDir, "src", "components", "TaskList.tsx"), "utf8");
    expect(callerContent).toContain('import { TaskCard } from "../features/tasks/TaskCard.js"');

    const movedContent = readFileSync(join(testDir, "src", "features", "tasks", "TaskCard.tsx"), "utf8");
    expect(movedContent).toContain('import { format } from "../../utils/format.js"');
  });

  it("TEST 3: Executes safe Windows case-only rename", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/components/taskcard.tsx",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");
  });
});
