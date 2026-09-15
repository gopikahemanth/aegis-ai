/**
 * Type Contract Verification Test Suite — Aegis V2.3 Project 2 Phase 6
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";
import { SemanticRefactoringVerifier } from "../refactoring/semantic-refactoring-verifier.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "types"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Type Contract Verification Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: SemanticRefactoringVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-type-ver-");
    writeFileSync(
      join(testDir, "src", "types", "user.ts"),
      `export interface User { id: string; name: string; }\n`,
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

  it("TEST 1: Valid type move passes semantic type verification", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/types/user.ts",
      symbolName: "User",
      destinationFile: "src/types/models.ts",
    });

    const result = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(result.passed).toBe(true);
  });
});
