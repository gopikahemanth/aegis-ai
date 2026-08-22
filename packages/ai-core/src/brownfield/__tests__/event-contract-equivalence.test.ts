/**
 * Event Contract Equivalence Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Expense Tracker E2E: Renaming payload field "category" -> "expenseCategory"
 *   across event emitter and consumer matches clean reference repo.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventContractExecutor } from "../runtime-contract/events/event-contract-executor.js";

function makeExpenseApp(dir: string, isRenamed: boolean) {
  mkdirSync(join(dir, "src", "events"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  const fieldStr = isRenamed ? "expenseCategory: category" : "category";
  const accessStr = isRenamed ? "evt.expenseCategory" : "evt.category";

  writeFileSync(
    join(dir, "src", "events", "expenseService.ts"),
    `import { emitter } from "./bus.js";\nexport function createExpense(id: string, category: string) {\n  emitter.emit("expense.created", { id, ${fieldStr} });\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "events", "expenseListener.ts"),
    `import { emitter } from "./bus.js";\nemitter.on("expense.created", (evt: any) => {\n  console.log(${accessStr});\n});\n`,
    "utf8"
  );
}

describe("Event Contract Equivalence Tests", () => {
  let origDir: string;
  let cleanDir: string;

  beforeEach(() => {
    origDir = mkdtempSync(join(tmpdir(), "aegis-event-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-event-clean-"));
  });

  afterEach(() => {
    try { rmSync(origDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Expense Tracker E2E — Renaming category -> expenseCategory in event matches clean reference repo", async () => {
    makeExpenseApp(origDir, false);
    makeExpenseApp(cleanDir, true);

    const executor = new EventContractExecutor(origDir);
    const result = await executor.execute({
      projectPath: origDir,
      operation: "EVENT_FIELD_RENAME",
      sourceFile: "src/events/expenseService.ts",
      eventName: "expense.created",
      renameField: { oldName: "category", newName: "expenseCategory" },
    });

    expect(result.success).toBe(true);

    const origProd = readFileSync(join(origDir, "src/events/expenseService.ts"), "utf8").trim();
    const cleanProd = readFileSync(join(cleanDir, "src/events/expenseService.ts"), "utf8").trim();
    expect(origProd).toBe(cleanProd);

    const origCons = readFileSync(join(origDir, "src/events/expenseListener.ts"), "utf8").trim();
    const cleanCons = readFileSync(join(cleanDir, "src/events/expenseListener.ts"), "utf8").trim();
    expect(origCons).toBe(cleanCons);
  });
});
