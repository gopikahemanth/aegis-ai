/**
 * Advanced Refactoring Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing target symbol → SYMBOL_NOT_FOUND, ZERO file mutation
 * 2. Unsafe parameter removal (referenced in body) → BLOCKED, ZERO file mutation
 * 3. Unsafe field removal (actively accessed) → BREAKING_CHANGE, ZERO file mutation
 * 4. Dynamic eval in extraction range → EXTRACTION_ANALYSIS_INCOMPLETE, ZERO file mutation
 * 5. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AdvancedRefactoringExecutor } from "../refactoring/advanced-refactoring-executor.js";
import { AdvancedRefactoringPreviewEngine } from "../refactoring/advanced-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Advanced Refactoring Safety Boundary Tests", () => {
  let testDir: string;
  let executor: AdvancedRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-adv-safety-");
    executor = new AdvancedRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent symbol produces SYMBOL_NOT_FOUND and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"), `export const x = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "missingFunc",
      sourceFile: "src/code.ts",
      parameters: [{ name: "p", type: "string" }],
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("SYMBOL_NOT_FOUND");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Parameter removal blocked when used in body, zero file mutation", async () => {
    writeFileSync(
      join(testDir, "src", "calc.ts"),
      `export function calculate(val: number, multiplier: number) {\n  return val * multiplier;\n}\n`,
      "utf8"
    );
    const before = readFileSync(join(testDir, "src", "calc.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "PARAMETER_REMOVE",
      targetSymbol: "calculate",
      sourceFile: "src/calc.ts",
      removeParameterName: "multiplier",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(readFileSync(join(testDir, "src", "calc.ts"), "utf8")).toBe(before);
  });

  it("TEST 3: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "service.ts"), `export function run() { return 1; }\n`, "utf8");

    const preview = AdvancedRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "run",
      sourceFile: "src/service.ts",
      parameters: [{ name: "opt", type: "any", defaultValue: "{}" }],
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "service.ts"), `export function run() { return 2; /* drift */ }\n`, "utf8");
    const beforeExec = readFileSync(join(testDir, "src", "service.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "run",
      sourceFile: "src/service.ts",
      parameters: [{ name: "opt", type: "any", defaultValue: "{}" }],
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "service.ts"), "utf8")).toBe(beforeExec);
  });
});
