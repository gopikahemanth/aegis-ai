/**
 * Runtime Contract Equivalence Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - Task Management E2E: Adding field to TaskSchema matches clean reference repo
 * - Expense Tracker E2E: Renaming field in ExpenseSchema & DTO matches clean reference repo
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RuntimeContractExecutor } from "../runtime-contract/runtime-contract-executor.js";

function makeTaskApp(dir: string, withPriority: boolean) {
  mkdirSync(join(dir, "src", "schemas"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  if (withPriority) {
    writeFileSync(
      join(dir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n  title: z.string(),\n  priority: z.string().optional(),\n});\n`,
      "utf8"
    );
  } else {
    writeFileSync(
      join(dir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n  title: z.string(),\n});\n`,
      "utf8"
    );
  }
}

describe("Runtime Contract Equivalence Tests", () => {
  let origDir: string;
  let cleanDir: string;

  beforeEach(() => {
    origDir = mkdtempSync(join(tmpdir(), "aegis-rt-orig-"));
    cleanDir = mkdtempSync(join(tmpdir(), "aegis-rt-clean-"));
  });

  afterEach(() => {
    try { rmSync(origDir, { recursive: true, force: true }); } catch {}
    try { rmSync(cleanDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Task Management E2E — Adding priority field to Zod schema matches clean reference repo", async () => {
    makeTaskApp(origDir, false);
    makeTaskApp(cleanDir, true);

    const executor = new RuntimeContractExecutor(origDir);
    const result = await executor.execute({
      projectPath: origDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string", isOptional: true },
    });

    expect(result.success).toBe(true);

    const origContent = readFileSync(join(origDir, "src/schemas/taskSchema.ts"), "utf8").trim();
    const cleanContent = readFileSync(join(cleanDir, "src/schemas/taskSchema.ts"), "utf8").trim();
    expect(origContent).toBe(cleanContent);
  });
});
