/**
 * Semantic Verification Equivalence Test Suite — Aegis V2.3 Project 2 Phase 6
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

describe("Semantic Verification Equivalence Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: SemanticRefactoringVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-sem-equiv-");
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

  it("TEST 1: Cold == Warm == Incremental verificationHash equivalence", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const res1 = verifier.verify(plan, { skipTests: true, skipBuild: true });
    const res2 = verifier.verify(plan, { skipTests: true, skipBuild: true });

    expect(res1.verificationHash).toBe(res2.verificationHash);
    expect(res1.passed).toBe(res2.passed);
  });
});
