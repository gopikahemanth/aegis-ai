/**
 * Runtime Contract Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing runtime schema → SCHEMA_NOT_FOUND, ZERO file mutation
 * 2. Unverified coercion/transform → UNRESOLVED_SCHEMA_COERCION, ZERO file mutation
 * 3. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RuntimeContractExecutor } from "../runtime-contract/runtime-contract-executor.js";
import { RuntimeContractPreviewEngine } from "../runtime-contract/runtime-contract-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "schemas"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Runtime Contract Safety Boundary Tests", () => {
  let testDir: string;
  let executor: RuntimeContractExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-runtime-safety-");
    executor = new RuntimeContractExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent schema produces SCHEMA_NOT_FOUND and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "schemas", "code.ts"), `export const x = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "schemas", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/code.ts",
      targetSymbol: "MissingSchema",
      newField: { name: "priority", type: "string" },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SCHEMA_NOT_FOUND");
    expect(readFileSync(join(testDir, "src", "schemas", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Coercion produces UNRESOLVED_SCHEMA_COERCION and zero file mutation", async () => {
    writeFileSync(
      join(testDir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.coerce.string(),\n});\n`,
      "utf8"
    );
    const before = readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string" },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("UNRESOLVED_SCHEMA_COERCION");
    expect(readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8")).toBe(before);
  });

  it("TEST 3: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(
      join(testDir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n});\n`,
      "utf8"
    );

    const preview = RuntimeContractPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string", isOptional: true },
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), `/* drift */\n`, "utf8");
    const beforeExec = readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string", isOptional: true },
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8")).toBe(beforeExec);
  });
});
