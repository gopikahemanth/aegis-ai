/**
 * RuntimeSchemaPatchPlanner Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - Simultaneous patch generation for Zod schema and TypeScript interface
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RuntimeSchemaResolver } from "../runtime-contract/runtime-schema-resolver.js";
import { RuntimeSchemaPatchPlanner } from "../runtime-contract/runtime-schema-patch-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "schemas"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RuntimeSchemaPatchPlanner Tests", () => {
  let testDir: string;
  let resolver: RuntimeSchemaResolver;
  let planner: RuntimeSchemaPatchPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-schema-patch-");

    writeFileSync(
      join(testDir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n  title: z.string(),\n});\n`,
      "utf8"
    );

    resolver = new RuntimeSchemaResolver(testDir);
    planner = new RuntimeSchemaPatchPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans Zod schema field addition", () => {
    const schema = resolver.resolveSchema("src/schemas/taskSchema.ts", "TaskSchema")!;
    const res = planner.planFieldAddition(null, schema, {
      name: "priority",
      type: "string",
      isOptional: true,
    });

    expect(res.valid).toBe(true);
    expect(res.patches.length).toBe(1);
    expect(res.patches[0].replacementSnippet).toContain("priority: z.string().optional()");
  });
});
