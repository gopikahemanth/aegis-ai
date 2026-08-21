/**
 * Rename Equivalence & Differential Correctness Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Differential correctness: Renamed repository matches clean copy with rename already in place
 * - Task Management real-world E2E: TaskService.updateTask → TaskService.modifyTask
 * - Expense Tracker real-world E2E: ExpenseService.createExpense → ExpenseService.addExpense
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolRenameExecutor } from "../refactoring/symbol-rename-executor.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeTaskApp(dir: string, functionName: string) {
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "task-app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  writeFileSync(
    join(dir, "src", "services", "taskService.ts"),
    `export function ${functionName}(id: string, title: string) {\n  return { id, title };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "controllers", "taskController.ts"),
    `import { ${functionName} } from "../services/taskService.js";\n\nexport function handleUpdate(req: any) {\n  return ${functionName}(req.id, req.title);\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "hooks", "useTaskAction.ts"),
    `import { ${functionName} } from "../services/taskService.js";\n\nexport function useTaskAction() {\n  return { update: ${functionName} };\n}\n`,
    "utf8"
  );
}

function makeExpenseApp(dir: string, functionName: string) {
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "expense-app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  writeFileSync(
    join(dir, "src", "services", "expenseService.ts"),
    `export function ${functionName}(amount: number, category: string) {\n  return { amount, category };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "controllers", "expenseController.ts"),
    `import { ${functionName} } from "../services/expenseService.js";\n\nexport function handleCreate(req: any) {\n  return ${functionName}(req.amount, req.category);\n}\n`,
    "utf8"
  );
}

describe("Rename Equivalence & Differential Correctness Tests", () => {
  let originalDir: string;
  let cleanDir: string;

  beforeEach(() => {
    originalDir = mkdtempSync(join(tmpdir(), "aegis-task-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-task-clean-"));
  });

  afterEach(() => {
    try { rmSync(originalDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Task Management E2E — updateTask → modifyTask matches clean reference repo", async () => {
    // 1. Setup original repo with updateTask
    makeTaskApp(originalDir, "updateTask");

    // 2. Setup clean target repo with modifyTask
    makeTaskApp(cleanDir, "modifyTask");

    // 3. Execute AST Rename on original repo
    const executor = new SymbolRenameExecutor(originalDir);
    const result = await executor.execute({
      projectPath: originalDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    expect(result.success).toBe(true);

    // 4. Compare file contents between renamed repo and clean repo
    const filesToCompare = [
      "src/services/taskService.ts",
      "src/controllers/taskController.ts",
      "src/hooks/useTaskAction.ts",
    ];

    for (const file of filesToCompare) {
      const renamedContent = readFileSync(join(originalDir, file), "utf8").trim();
      const cleanContent = readFileSync(join(cleanDir, file), "utf8").trim();
      expect(renamedContent).toBe(cleanContent);
    }

    // 5. Compare resolved symbol tables
    const origResolver = new SymbolReferenceResolver(originalDir);
    const cleanResolver = new SymbolReferenceResolver(cleanDir);

    const origSummaries = origResolver.parseProject({ bypassCache: true });
    const cleanSummaries = cleanResolver.parseProject({ bypassCache: true });

    const origSymbols = [...origSummaries.values()].flatMap(s => s.symbols.map(sym => sym.name)).sort();
    const cleanSymbols = [...cleanSummaries.values()].flatMap(s => s.symbols.map(sym => sym.name)).sort();

    expect(origSymbols).toEqual(cleanSymbols);
  });

  it("TEST 2: Expense Tracker E2E — createExpense → addExpense matches clean reference repo", async () => {
    const expOrigDir = mkdtempSync(join(tmpdir(), "aegis-exp-orig-"));
    const expCleanDir = mkdtempSync(join(tmpdir(), "aegis-exp-clean-"));

    try {
      makeExpenseApp(expOrigDir, "createExpense");
      makeExpenseApp(expCleanDir, "addExpense");

      const executor = new SymbolRenameExecutor(expOrigDir);
      const result = await executor.execute({
        projectPath: expOrigDir,
        sourceFile: "src/services/expenseService.ts",
        symbolName: "createExpense",
        newName: "addExpense",
      });

      expect(result.success).toBe(true);

      const serviceRenamed = readFileSync(join(expOrigDir, "src/services/expenseService.ts"), "utf8").trim();
      const serviceClean = readFileSync(join(expCleanDir, "src/services/expenseService.ts"), "utf8").trim();
      expect(serviceRenamed).toBe(serviceClean);

      const controllerRenamed = readFileSync(join(expOrigDir, "src/controllers/expenseController.ts"), "utf8").trim();
      const controllerClean = readFileSync(join(expCleanDir, "src/controllers/expenseController.ts"), "utf8").trim();
      expect(controllerRenamed).toBe(controllerClean);
    } finally {
      try { rmSync(expOrigDir, { recursive: true, force: true }); } catch {}
      try { rmSync(expCleanDir, { recursive: true, force: true }); } catch {}
    }
  });
});
