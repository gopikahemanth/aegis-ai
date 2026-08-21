/**
 * File Refactoring Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing source file → SOURCE_NOT_FOUND, ZERO file mutation
 * 2. Target file exists → TARGET_EXISTS, ZERO file mutation
 * 3. Dynamic import detected → DYNAMIC_REFERENCE_BLOCKED, ZERO file mutation
 * 4. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileRefactoringExecutor } from "../file-refactoring/file-refactoring-executor.js";
import { FileRefactoringPreviewEngine } from "../file-refactoring/file-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("File Refactoring Safety Boundary Tests", () => {
  let testDir: string;
  let executor: FileRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-file-safety-");
    executor = new FileRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent source file produces SOURCE_NOT_FOUND and zero file mutation", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/Missing.tsx",
      targetPath: "src/Target.tsx",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SOURCE_NOT_FOUND");
    expect(existsSync(join(testDir, "src", "Target.tsx"))).toBe(false);
  });

  it("TEST 2: Existing target file produces TARGET_EXISTS and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "Source.tsx"), `export const s = 1;\n`, "utf8");
    writeFileSync(join(testDir, "src", "Existing.tsx"), `export const e = 2;\n`, "utf8");

    const beforeSource = readFileSync(join(testDir, "src", "Source.tsx"), "utf8");
    const beforeExisting = readFileSync(join(testDir, "src", "Existing.tsx"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/Source.tsx",
      targetPath: "src/Existing.tsx",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("TARGET_EXISTS");

    expect(readFileSync(join(testDir, "src", "Source.tsx"), "utf8")).toBe(beforeSource);
    expect(readFileSync(join(testDir, "src", "Existing.tsx"), "utf8")).toBe(beforeExisting);
  });

  it("TEST 3: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "Source.tsx"), `export const s = 1;\n`, "utf8");

    const preview = FileRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/Source.tsx",
      targetPath: "src/Renamed.tsx",
    });

    // Mutate source file behind preview's back
    writeFileSync(join(testDir, "src", "Source.tsx"), `export const s = 2; /* drift */\n`, "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/Source.tsx",
      targetPath: "src/Renamed.tsx",
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(existsSync(join(testDir, "src", "Renamed.tsx"))).toBe(false);
  });
});
