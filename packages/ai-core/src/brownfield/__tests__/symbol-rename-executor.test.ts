/**
 * SymbolRenameExecutor Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Multi-file AST rename execution
 * - Clean update of definition, imports, and calls
 * - Bit-for-bit preservation of surrounding comments and types
 * - Zero mutation when rename is blocked
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolRenameExecutor } from "../refactoring/symbol-rename-executor.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SymbolRenameExecutor Tests", () => {
  let testDir: string;
  let executor: SymbolRenameExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-executor-");

    writeFileSync(join(testDir, "src", "taskService.ts"),
      `/** Task service doc */\nexport function updateTask(id: string, title: string): { id: string; title: string } {\n  return { id, title };\n}\n`, "utf8");

    writeFileSync(join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\n\nexport function handleUpdate(req: any) {\n  // call updateTask\n  return updateTask(req.id, req.title);\n}\n`, "utf8");

    executor = new SymbolRenameExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Executes multi-file AST rename, updating definition, imports, and calls while preserving comments", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");
    expect(result.touchedFiles).toContain("src/taskService.ts");
    expect(result.touchedFiles).toContain("src/taskController.ts");

    const updatedService = readFileSync(join(testDir, "src", "taskService.ts"), "utf8");
    const updatedController = readFileSync(join(testDir, "src", "taskController.ts"), "utf8");

    expect(updatedService).toContain("export function modifyTask(id: string, title: string)");
    expect(updatedService).toContain("/** Task service doc */"); // Comments preserved!

    expect(updatedController).toContain('import { modifyTask } from "./taskService.js";');
    expect(updatedController).toContain("return modifyTask(req.id, req.title);");
    expect(updatedController).toContain("// call updateTask"); // Non-symbol comment preserved!
  });

  it("TEST 2: Zero disk mutation when rename has conflict", async () => {
    // Add conflicting function in taskController.ts
    writeFileSync(join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\nexport function modifyTask() {}\n`, "utf8");

    const serviceBefore = readFileSync(join(testDir, "src", "taskService.ts"), "utf8");
    const controllerBefore = readFileSync(join(testDir, "src", "taskController.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SYMBOL_COLLISION");

    // Invariant: Disk files must be untouched
    const serviceAfter = readFileSync(join(testDir, "src", "taskService.ts"), "utf8");
    const controllerAfter = readFileSync(join(testDir, "src", "taskController.ts"), "utf8");
    expect(serviceAfter).toBe(serviceBefore);
    expect(controllerAfter).toBe(controllerBefore);
  });
});
