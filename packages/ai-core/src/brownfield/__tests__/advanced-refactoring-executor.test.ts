/**
 * AdvancedRefactoringExecutor Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Transactional execution of compound AST refactorings
 * - Multi-file parameter addition across definition and caller files
 * - Zero mutation when refactoring status is BLOCKED
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AdvancedRefactoringExecutor } from "../refactoring/advanced-refactoring-executor.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("AdvancedRefactoringExecutor Tests", () => {
  let testDir: string;
  let executor: AdvancedRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-adv-exec-");

    writeFileSync(
      join(testDir, "src", "taskService.ts"),
      `export function updateTask(id: string, title: string) {\n  return { id, title };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\nexport function handle(req: any) {\n  return updateTask(req.id, req.title);\n}\n`,
      "utf8"
    );

    executor = new AdvancedRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Executes parameter addition across definition and caller files", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "updateTask",
      sourceFile: "src/taskService.ts",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");
    expect(result.touchedFiles).toContain("src/taskService.ts");
    expect(result.touchedFiles).toContain("src/taskController.ts");

    const updatedService = readFileSync(join(testDir, "src", "taskService.ts"), "utf8");
    const updatedController = readFileSync(join(testDir, "src", "taskController.ts"), "utf8");

    expect(updatedService).toContain('priority: string = "NORMAL"');
    expect(updatedController).toContain('updateTask(req.id, req.title, "NORMAL")');
  });

  it("TEST 2: Zero disk mutation when refactoring is blocked by Prisma safety", async () => {
    writeFileSync(join(testDir, "src", "schema.prisma"), `model User { id String @id }\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "schema.prisma"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "TYPE_FIELD_REMOVE",
      targetSymbol: "User",
      sourceFile: "src/schema.prisma",
      removeFieldName: "id",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(readFileSync(join(testDir, "src", "schema.prisma"), "utf8")).toBe(before);
  });
});
