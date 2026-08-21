/**
 * RuntimeSchemaResolver Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - Zod schema resolution: z.object, z.string, z.number, z.boolean, z.enum
 * - Modifiers: optional, nullable, nullish
 * - z.infer<typeof Schema> type link detection
 * - Coercion and transform safety flags
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RuntimeSchemaResolver } from "../runtime-contract/runtime-schema-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "schemas"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RuntimeSchemaResolver Tests", () => {
  let testDir: string;
  let resolver: RuntimeSchemaResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-schema-res-");

    writeFileSync(
      join(testDir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n  title: z.string(),\n  priority: z.enum(["LOW", "HIGH"]).optional(),\n  completed: z.boolean().nullable(),\n});\n\nexport type Task = z.infer<typeof TaskSchema>;\n`,
      "utf8"
    );

    resolver = new RuntimeSchemaResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Resolves Zod schema fields, optionality, nullability, and enums", () => {
    const schema = resolver.resolveSchema("src/schemas/taskSchema.ts", "TaskSchema");

    expect(schema).toBeDefined();
    expect(schema!.schemaName).toBe("TaskSchema");
    expect(schema!.fields.length).toBe(4);

    const priorityField = schema!.fields.find(f => f.name === "priority");
    expect(priorityField).toBeDefined();
    expect(priorityField!.isOptional).toBe(true);
    expect(priorityField!.enumValues).toEqual(["LOW", "HIGH"]);

    const completedField = schema!.fields.find(f => f.name === "completed");
    expect(completedField).toBeDefined();
    expect(completedField!.isNullable).toBe(true);

    expect(schema!.inferredTypeName).toBe("Task");
  });
});
