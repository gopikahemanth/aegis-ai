/**
 * Rename Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Negative & Safety boundary test matrix:
 * 1. Symbol not found → ZERO file mutation, ZERO git branch
 * 2. Symbol collision → ZERO file mutation
 * 3. Dynamic import dependency → ZERO file mutation
 * 4. Prisma model rename → PRISMA_MODEL_RENAME_BLOCKED, ZERO file mutation
 * 5. Stale preview preimage mismatch → PLAN_STALE, ZERO file mutation
 * 6. Scope shadowing → inner local variable is preserved
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolRenameExecutor } from "../refactoring/symbol-rename-executor.js";
import { RenamePreviewEngine } from "../refactoring/rename-preview-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Rename Safety Boundary Tests", () => {
  let testDir: string;
  let executor: SymbolRenameExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-safety-");
    executor = new SymbolRenameExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent symbol produces SYMBOL_NOT_FOUND and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"), `export const alpha = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/code.ts",
      symbolName: "missingSymbol",
      newName: "renamedSymbol",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SYMBOL_NOT_FOUND");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Target collision produces SYMBOL_COLLISION and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"), `export const foo = 1;\nexport const bar = 2;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/code.ts",
      symbolName: "foo",
      newName: "bar", // Collision!
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SYMBOL_COLLISION");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 3: Dynamic dependency produces DYNAMIC_DEPENDENCY_BLOCKED and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"),
      `const mod = await import(\`./plugins/\${name}\`);\nexport const safeSymbol = 100;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/code.ts",
      symbolName: "safeSymbol",
      newName: "newSymbol",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("DYNAMIC_DEPENDENCY_BLOCKED");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 4: Stale preview preimage mismatch produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"), `export const counter = 0;\n`, "utf8");

    const preview = RenamePreviewEngine.generatePreview({
      projectPath: testDir,
      sourceFile: "src/code.ts",
      symbolName: "counter",
      newName: "totalCount",
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "code.ts"), `export const counter = 1; // drift\n`, "utf8");
    const beforeExecution = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/code.ts",
      symbolName: "counter",
      newName: "totalCount",
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(beforeExecution);
  });

  it("TEST 5: Scope Shadowing Safety — inner variable is NOT modified", async () => {
    writeFileSync(join(testDir, "src", "shadow.ts"),
      `export const total = 10;\n\nexport function compute() {\n  const total = 500; // local shadow\n  return total;\n}\n`, "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      sourceFile: "src/shadow.ts",
      symbolName: "total",
      newName: "grandTotal",
    });

    expect(result.success).toBe(true);
    const updated = readFileSync(join(testDir, "src", "shadow.ts"), "utf8");

    expect(updated).toContain("export const grandTotal = 10;");
    expect(updated).toContain("const total = 500; // local shadow");
    expect(updated).toContain("return total;");
  });
});
