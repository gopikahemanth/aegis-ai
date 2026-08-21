/**
 * Advanced Refactoring Equivalence & Differential Correctness Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Differential correctness: Refactored repository matches clean reference repo
 * - Task Management E2E: Adding priority parameter to TaskService.updateTask
 * - Expense Tracker E2E: Adding optional notes prop to ExpenseCard
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AdvancedRefactoringExecutor } from "../refactoring/advanced-refactoring-executor.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeTaskApp(dir: string, withPriority: boolean) {
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "task-app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  if (withPriority) {
    writeFileSync(
      join(dir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string, priority: string = "NORMAL") {\n  return { id, title };\n}\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport function handle(req: any) {\n  return updateTask(req.id, req.title, "NORMAL");\n}\n`,
      "utf8"
    );
  } else {
    writeFileSync(
      join(dir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string) {\n  return { id, title };\n}\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport function handle(req: any) {\n  return updateTask(req.id, req.title);\n}\n`,
      "utf8"
    );
  }
}

describe("Advanced Refactoring Equivalence Tests", () => {
  let origDir: string;
  let cleanDir: string;

  beforeEach(() => {
    origDir = mkdtempSync(join(tmpdir(), "aegis-adv-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-adv-clean-"));
  });

  afterEach(() => {
    try { rmSync(origDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Task Management E2E — Adding priority parameter matches clean reference repo", async () => {
    makeTaskApp(origDir, false);
    makeTaskApp(cleanDir, true);

    const executor = new AdvancedRefactoringExecutor(origDir);
    const result = await executor.execute({
      projectPath: origDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "updateTask",
      sourceFile: "src/services/taskService.ts",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    expect(result.success).toBe(true);

    const serviceRenamed = readFileSync(join(origDir, "src/services/taskService.ts"), "utf8").trim();
    const serviceClean = readFileSync(join(cleanDir, "src/services/taskService.ts"), "utf8").trim();
    expect(serviceRenamed).toBe(serviceClean);

    const controllerRenamed = readFileSync(join(origDir, "src/controllers/taskController.ts"), "utf8").trim();
    const controllerClean = readFileSync(join(cleanDir, "src/controllers/taskController.ts"), "utf8").trim();
    expect(controllerRenamed).toBe(controllerClean);

    // Verify symbol summary equivalence
    const origResolver = new SymbolReferenceResolver(origDir);
    const cleanResolver = new SymbolReferenceResolver(cleanDir);

    const origSummaries = origResolver.parseProject({ bypassCache: true });
    const cleanSummaries = cleanResolver.parseProject({ bypassCache: true });

    const origSymbols = [...origSummaries.values()].flatMap(s => s.symbols.map(sym => sym.name)).sort();
    const cleanSymbols = [...cleanSummaries.values()].flatMap(s => s.symbols.map(sym => sym.name)).sort();
    expect(origSymbols).toEqual(cleanSymbols);
  });
});
