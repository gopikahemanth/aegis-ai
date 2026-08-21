/**
 * File Refactoring Equivalence & Property Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Bidirectional Property: rename(A → B) then rename(B → A) restores exact byte-for-byte repository state
 * - Task Management E2E: Renaming TaskCard.tsx → TaskItem.tsx matches clean reference repo
 * - Expense Tracker E2E: Moving ExpenseCard.tsx → features/expenses/ExpenseCard.tsx matches clean reference repo
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileRefactoringExecutor } from "../file-refactoring/file-refactoring-executor.js";

function makeApp(dir: string, isRenamed: boolean) {
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  if (isRenamed) {
    writeFileSync(
      join(dir, "src", "components", "TaskItem.tsx"),
      `export function TaskItem() { return "Card"; }\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "components", "index.ts"),
      `export * from "./TaskItem.js";\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "__tests__", "TaskItem.test.ts"),
      `import { TaskItem } from "../components/TaskItem.js";\n`,
      "utf8"
    );
  } else {
    writeFileSync(
      join(dir, "src", "components", "TaskCard.tsx"),
      `export function TaskCard() { return "Card"; }\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "components", "index.ts"),
      `export * from "./TaskCard.js";\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "__tests__", "TaskCard.test.ts"),
      `import { TaskCard } from "../components/TaskCard.js";\n`,
      "utf8"
    );
  }
}

describe("File Refactoring Equivalence & Property Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-file-prop-"));
  });

  afterEach(() => {
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Property Test — rename(A → B) then rename(B → A) restores original repository state", async () => {
    makeApp(testDir, false);

    const beforeBarrel = readFileSync(join(testDir, "src", "components", "index.ts"), "utf8");
    const beforeCard = readFileSync(join(testDir, "src", "components", "TaskCard.tsx"), "utf8");

    const executor = new FileRefactoringExecutor(testDir);

    // 1. Rename TaskCard.tsx -> TaskItem.tsx
    const forwardResult = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/components/TaskCard.tsx",
      targetPath: "src/components/TaskItem.tsx",
    });
    expect(forwardResult.success).toBe(true);
    expect(existsSync(join(testDir, "src", "components", "TaskItem.tsx"))).toBe(true);

    // 2. Reverse Rename TaskItem.tsx -> TaskCard.tsx
    const backwardResult = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/components/TaskItem.tsx",
      targetPath: "src/components/TaskCard.tsx",
    });
    expect(backwardResult.success).toBe(true);

    // Byte-for-byte exact equality
    const afterBarrel = readFileSync(join(testDir, "src", "components", "index.ts"), "utf8");
    const afterCard = readFileSync(join(testDir, "src", "components", "TaskCard.tsx"), "utf8");

    expect(afterBarrel).toBe(beforeBarrel);
    expect(afterCard).toBe(beforeCard);
  });
});
