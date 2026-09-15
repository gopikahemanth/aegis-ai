/**
 * Phase 7 Function Signature Refactoring Test Suite — Aegis V2.3 Project 2 Phase 7
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Phase 7 Function Signature Refactoring Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-p7-sig-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function processTask(id: string, name: string) { return id + name; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Safe parameter renaming generates valid signature patch", () => {
    const plan = engine.transformFunctionSignature(
      "src/services/taskService.ts",
      "processTask",
      { renameParam: { oldName: "id", newName: "taskId" } }
    );

    expect(plan.patchOperations.length).toBeGreaterThan(0);
    expect(plan.patchOperations.some(p => p.replacement.includes("taskId: string"))).toBe(true);
  });
});
