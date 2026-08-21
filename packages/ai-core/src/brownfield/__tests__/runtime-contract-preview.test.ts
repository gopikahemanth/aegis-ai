/**
 * RuntimeContractPreview Test Suite — Aegis V2.3 Project 2 Phase 7.1
 *
 * Tests:
 * - Side-effect-free preview generation with unified diffs
 * - Zero disk mutation during preview
 * - Immutability check and PLAN_STALE detection on disk drift
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RuntimeContractPreviewEngine } from "../runtime-contract/runtime-contract-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "schemas"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RuntimeContractPreviewEngine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-runtime-prev-");

    writeFileSync(
      join(testDir, "src", "schemas", "taskSchema.ts"),
      `import { z } from "zod";\n\nexport const TaskSchema = z.object({\n  id: z.string(),\n  title: z.string(),\n});\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preview generates unified diffs with ZERO disk modification", () => {
    const beforeContent = readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8");

    const preview = RuntimeContractPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string", isOptional: true },
    });

    expect(preview.status).toBe("READY");
    expect(preview.fileDiffs.length).toBe(1);
    expect(preview.diffSummary.filesChanged).toBe(1);

    // Invariant: Disk file must remain untouched
    expect(readFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), "utf8")).toBe(beforeContent);
  });

  it("TEST 2: verifyImmutability detects disk drift and flags PLAN_STALE", () => {
    const preview = RuntimeContractPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "SCHEMA_FIELD_ADD",
      sourceFile: "src/schemas/taskSchema.ts",
      targetSymbol: "TaskSchema",
      newField: { name: "priority", type: "string", isOptional: true },
    });

    const checkInitial = RuntimeContractPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkInitial.valid).toBe(true);

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "schemas", "taskSchema.ts"), `/* drift */\n`, "utf8");

    const checkAfter = RuntimeContractPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkAfter.valid).toBe(false);
    expect(checkAfter.error).toContain("PLAN_STALE");
  });
});
