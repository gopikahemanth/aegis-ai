/**
 * Semantic Verification Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 6
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";
import { SemanticRefactoringVerifier } from "../refactoring/semantic-refactoring-verifier.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Semantic Verification Safety Boundary Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: SemanticRefactoringVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-sem-safe-");
    writeFileSync(
      join(testDir, "src", "services", "calc.ts"),
      `export function calc() { return 1; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
    verifier = new SemanticRefactoringVerifier(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Blocked plan produces verification failure with 0 mutations", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/calc.ts",
      symbolName: "missing",
      destinationFile: "src/utils/calc.ts",
    });

    const result = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(result.passed).toBe(false);
    expect(result.status).toBe("FAILED");
  });
});
