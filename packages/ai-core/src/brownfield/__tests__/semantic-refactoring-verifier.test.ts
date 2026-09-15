/**
 * SemanticRefactoringVerifier Test Suite — Aegis V2.3 Project 2 Phase 6
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
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SemanticRefactoringVerifier Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: SemanticRefactoringVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-sem-ver-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string) { return id; }\n`,
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

  it("TEST 1: Valid move passes semantic verification with deterministic verificationHash", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const result = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(result.passed).toBe(true);
    expect(result.status).toBe("PASSED");
    expect(result.verificationHash.length).toBe(64);
  });

  it("TEST 2: Syntax corruption in patch triggers AST_PARSE_ERROR", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    // Corrupt destination patch with invalid syntax
    plan.filePatches.forEach(fp => {
      fp.operations.forEach(op => {
        if (op.operationKind === "INSERT_DECLARATION") {
          op.replacement = "export function {{{ invalid syntax";
        }
      });
    });

    const result = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(result.passed).toBe(false);
    expect(result.status).toBe("AST_PARSE_ERROR");
  });
});
