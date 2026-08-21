/**
 * ParameterChangeAnalyzer Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Parameter addition with optionality & default values
 * - Parameter removal when safe
 * - Parameter removal BLOCKED when referenced inside function body
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { ParameterChangeAnalyzer } from "../refactoring/parameter-change-analyzer.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ParameterChangeAnalyzer Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let analyzer: ParameterChangeAnalyzer;

  beforeEach(() => {
    testDir = makeProject("aegis-param-");
    defResolver = new SymbolDefinitionResolver(testDir);
    analyzer = new ParameterChangeAnalyzer(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans parameter addition with default argument propagation", () => {
    writeFileSync(
      join(testDir, "src", "math.ts"),
      `export function multiply(a: number, b: number) { return a * b; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "consumer.ts"),
      `import { multiply } from "./math.js";\nexport const res = multiply(2, 3);\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/math.ts", "multiply")!;
    const res = analyzer.planParameterAddition(
      def,
      { name: "factor", type: "number", defaultValue: "1" },
      ["src/math.ts", "src/consumer.ts"]
    );

    expect(res.valid).toBe(true);
    expect(res.definitionPatch).toBeDefined();
    expect(res.definitionPatch!.replacementSnippet).toContain("factor: number = 1");
    expect(res.callSitePatches.length).toBe(1);
    expect(res.callSitePatches[0].originalSnippet).toBe("3");
    expect(res.callSitePatches[0].replacementSnippet).toBe("3, 1");
  });

  it("TEST 2: Parameter removal succeeds when parameter is unused in body", () => {
    writeFileSync(
      join(testDir, "src", "calc.ts"),
      `export function calculate(val: number, legacyFlag: boolean) { return val * 2; }\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/calc.ts", "calculate")!;
    const res = analyzer.planParameterRemoval(def, "legacyFlag", ["src/calc.ts"]);

    expect(res.valid).toBe(true);
    expect(res.definitionPatch).toBeDefined();
    expect(res.definitionPatch!.replacementSnippet).toBe("(val: number)");
  });

  it("TEST 3: Parameter removal is BLOCKED when parameter is used in body", () => {
    writeFileSync(
      join(testDir, "src", "calc.ts"),
      `export function calculate(val: number, multiplier: number) { return val * multiplier; }\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/calc.ts", "calculate")!;
    const res = analyzer.planParameterRemoval(def, "multiplier", ["src/calc.ts"]);

    expect(res.valid).toBe(false);
    expect(res.blockedReason).toContain("BLOCKED: Parameter \"multiplier\" is referenced inside the implementation");
  });
});
