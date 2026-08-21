/**
 * Contract Refactoring Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing target contract → CONTRACT_NOT_FOUND, ZERO file mutation
 * 2. Missing default value on required parameter → CONTRACT_CHANGE_BLOCKED, ZERO file mutation
 * 3. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractRefactoringExecutor } from "../contract-refactoring/contract-refactoring-executor.js";
import { ContractRefactoringPreviewEngine } from "../contract-refactoring/contract-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Contract Refactoring Safety Boundary Tests", () => {
  let testDir: string;
  let executor: ContractRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-contract-safety-");
    executor = new ContractRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent contract produces CONTRACT_NOT_FOUND and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "code.ts"), `export const x = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
      sourceFile: "src/code.ts",
      targetSymbol: "missingFunc",
      parameters: [{ name: "p", type: "string" }],
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("CONTRACT_NOT_FOUND");
    expect(readFileSync(join(testDir, "src", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Missing default value on required parameter produces CONTRACT_CHANGE_BLOCKED", async () => {
    writeFileSync(join(testDir, "src", "srv.ts"), `export function run() { return 1; }\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "srv.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
      sourceFile: "src/srv.ts",
      targetSymbol: "run",
      parameters: [{ name: "requiredParam", type: "string" }], // No default value
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("CONTRACT_CHANGE_BLOCKED");
    expect(readFileSync(join(testDir, "src", "srv.ts"), "utf8")).toBe(before);
  });

  it("TEST 3: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "srv.ts"), `export function run(a: number) { return a; }\n`, "utf8");

    const preview = ContractRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
      sourceFile: "src/srv.ts",
      targetSymbol: "run",
      parameters: [{ name: "opt", type: "string", defaultValue: '"val"' }],
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "srv.ts"), `export function run(a: number) { /* drift */ return a; }\n`, "utf8");
    const beforeExec = readFileSync(join(testDir, "src", "srv.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "EXPORTED_FUNCTION_PARAMETER_ADD",
      sourceFile: "src/srv.ts",
      targetSymbol: "run",
      parameters: [{ name: "opt", type: "string", defaultValue: '"val"' }],
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "srv.ts"), "utf8")).toBe(beforeExec);
  });
});
