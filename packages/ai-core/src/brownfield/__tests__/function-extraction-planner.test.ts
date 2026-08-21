/**
 * FunctionExtractionPlanner Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Safe function extraction with free variable analysis
 * - Extraction rejection when dynamic eval/with is present
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FunctionExtractionPlanner } from "../refactoring/function-extraction-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("FunctionExtractionPlanner Tests", () => {
  let testDir: string;
  let planner: FunctionExtractionPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-extract-");
    planner = new FunctionExtractionPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans function extraction with free variable parameters", () => {
    const fileContent = `export function calculateTotal(price: number, qty: number) {\n  const subtotal = price * qty;\n  return subtotal;\n}\n`;
    writeFileSync(join(testDir, "src", "math.ts"), fileContent, "utf8");

    const startPos = fileContent.indexOf("price * qty");
    const endPos = startPos + "price * qty".length;

    const res = planner.planFunctionExtraction("src/math.ts", {
      startPos,
      endPos,
      extractedName: "computeSubtotal",
      parameters: ["price", "qty"],
    });

    expect(res.valid).toBe(true);
    expect(res.patches.length).toBe(2);
    expect(res.patches[0].replacementSnippet).toContain("computeSubtotal(price, qty)");
    expect(res.patches[1].replacementSnippet).toContain("function computeSubtotal(price, qty)");
  });

  it("TEST 2: Rejects extraction containing dynamic eval", () => {
    const fileContent = `export function run() {\n  eval("console.log(1)");\n}\n`;
    writeFileSync(join(testDir, "src", "eval.ts"), fileContent, "utf8");

    const startPos = fileContent.indexOf("eval");
    const endPos = fileContent.indexOf(";") + 1;

    const res = planner.planFunctionExtraction("src/eval.ts", {
      startPos,
      endPos,
      extractedName: "runEval",
    });

    expect(res.valid).toBe(false);
    expect(res.blockedReason).toContain("EXTRACTION_ANALYSIS_INCOMPLETE: Statement range contains dynamic eval");
  });
});
