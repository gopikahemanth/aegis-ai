/**
 * Phase 7 Structural Transformations Test Suite — Aegis V2.3 Project 2 Phase 7
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
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Phase 7 Structural Transformations Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: SemanticRefactoringVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-p7-trans-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function getTask(id: string) { return id; }\nexport function setTask(id: string) { return id; }\n`,
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

  it("TEST 1: Multi-symbol move generates valid patches and passes semantic verification", () => {
    const plan = engine.moveSymbols({
      sourceFile: "src/services/taskService.ts",
      symbolNames: ["getTask", "setTask"],
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.patchOperations.length).toBeGreaterThan(0);

    const semResult = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(semResult.passed).toBe(true);
    expect(semResult.status).toBe("PASSED");
  });

  it("TEST 2: Extraction generates re-export bridge and preserves consumer imports", () => {
    const plan = engine.extractSymbols({
      sourceFile: "src/services/taskService.ts",
      symbolNames: ["getTask"],
      destinationFile: "src/services/taskQueryService.ts",
      reExportFromSource: true,
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.patchOperations.some(p => p.operationKind === "INSERT_EXPORT")).toBe(true);

    const semResult = verifier.verify(plan, { skipTests: true, skipBuild: true });
    expect(semResult.passed).toBe(true);
  });
});
