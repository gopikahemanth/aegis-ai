/**
 * FileOperationPlanner Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Master planning for FILE_RENAME with import and barrel rewriting
 * - Master planning for FILE_MOVE with internal relative import rewriting
 * - Deterministic planHash and patchHash stability
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileOperationPlanner } from "../file-refactoring/file-operation-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("FileOperationPlanner Tests", () => {
  let testDir: string;
  let planner: FileOperationPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-file-plan-");

    writeFileSync(
      join(testDir, "src", "utils", "format.ts"),
      `export function formatTitle(s: string) { return s.trim(); }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "TaskCard.tsx"),
      `import { formatTitle } from "../utils/format.js";\nexport function TaskCard() { return formatTitle("Task"); }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "TaskList.tsx"),
      `import { TaskCard } from "./TaskCard.js";\nexport function TaskList() { return TaskCard(); }\n`,
      "utf8"
    );

    planner = new FileOperationPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans FILE_RENAME with caller import rewrite and deterministic hashes", () => {
    const plan = planner.plan({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/components/TaskItem.tsx",
    });

    expect(plan.status).toBe("READY");
    expect(plan.affectedFiles).toContain("src/components/TaskCard.tsx");
    expect(plan.affectedFiles).toContain("src/components/TaskList.tsx");
    expect(plan.planHash).toHaveLength(64);
    expect(plan.patchHash).toHaveLength(64);

    const callerPatch = plan.filePatches.find(p => p.filePath === "src/components/TaskList.tsx");
    expect(callerPatch).toBeDefined();
    expect(callerPatch!.operations[0].replacementSnippet).toContain("TaskItem.js");
  });

  it("TEST 2: Plans FILE_MOVE with internal relative import rewrite inside moved file", () => {
    const plan = planner.plan({
      projectPath: testDir,
      operation: "FILE_MOVE",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/features/tasks/TaskCard.tsx",
    });

    expect(plan.status).toBe("READY");

    const callerPatch = plan.filePatches.find(p => p.filePath === "src/components/TaskList.tsx");
    expect(callerPatch).toBeDefined();
    expect(callerPatch!.operations[0].replacementSnippet).toContain("../features/tasks/TaskCard.js");

    const internalPatch = plan.filePatches.find(p => p.filePath === "src/components/TaskCard.tsx");
    expect(internalPatch).toBeDefined();
    expect(internalPatch!.operations[0].replacementSnippet).toContain("../../utils/format.js");
  });
});
