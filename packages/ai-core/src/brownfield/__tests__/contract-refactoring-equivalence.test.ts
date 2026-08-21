/**
 * Contract Refactoring Equivalence Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Expense Tracker E2E: DTO field rename category → expenseCategory equivalence
 * - Task Management E2E: Service contract parameter propagation equivalence
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractRefactoringExecutor } from "../contract-refactoring/contract-refactoring-executor.js";

function makeExpenseApp(dir: string, isRenamed: boolean) {
  mkdirSync(join(dir, "src", "dto"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  if (isRenamed) {
    writeFileSync(
      join(dir, "src", "dto", "ExpenseDTO.ts"),
      `export interface ExpenseDTO {\n  id: string;\n  expenseCategory: string;\n}\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "controllers", "expenseController.ts"),
      `import { ExpenseDTO } from "../dto/ExpenseDTO.js";\nexport function handle(dto: ExpenseDTO) {\n  return dto.expenseCategory;\n}\n`,
      "utf8"
    );
  } else {
    writeFileSync(
      join(dir, "src", "dto", "ExpenseDTO.ts"),
      `export interface ExpenseDTO {\n  id: string;\n  category: string;\n}\n`,
      "utf8"
    );
    writeFileSync(
      join(dir, "src", "controllers", "expenseController.ts"),
      `import { ExpenseDTO } from "../dto/ExpenseDTO.js";\nexport function handle(dto: ExpenseDTO) {\n  return dto.category;\n}\n`,
      "utf8"
    );
  }
}

describe("Contract Refactoring Equivalence Tests", () => {
  let origDir: string;
  let cleanDir: string;

  beforeEach(() => {
    origDir = mkdtempSync(join(tmpdir(), "aegis-contract-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-contract-clean-"));
  });

  afterEach(() => {
    try { rmSync(origDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Expense Tracker E2E — DTO field rename matches clean reference repo", async () => {
    makeExpenseApp(origDir, false);
    makeExpenseApp(cleanDir, true);

    const executor = new ContractRefactoringExecutor(origDir);
    const result = await executor.execute({
      projectPath: origDir,
      operation: "DTO_FIELD_RENAME",
      sourceFile: "src/dto/ExpenseDTO.ts",
      targetSymbol: "ExpenseDTO",
      renameField: { oldName: "category", newName: "expenseCategory" },
    });

    expect(result.success).toBe(true);

    const origDto = readFileSync(join(origDir, "src/dto/ExpenseDTO.ts"), "utf8").trim();
    const cleanDto = readFileSync(join(cleanDir, "src/dto/ExpenseDTO.ts"), "utf8").trim();
    expect(origDto).toBe(cleanDto);

    const origCtrl = readFileSync(join(origDir, "src/controllers/expenseController.ts"), "utf8").trim();
    const cleanCtrl = readFileSync(join(cleanDir, "src/controllers/expenseController.ts"), "utf8").trim();
    expect(origCtrl).toBe(cleanCtrl);
  });
});
