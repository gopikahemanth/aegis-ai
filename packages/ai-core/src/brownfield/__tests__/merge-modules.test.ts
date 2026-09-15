/**
 * Merge Modules Test Suite — Aegis V2.3 Project 2 Phase 5
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

describe("Merge Modules Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-merge-mod-");
    writeFileSync(
      join(testDir, "src", "services", "taskA.ts"),
      `export function doA() { return "A"; }\n`,
      "utf8"
    );
    writeFileSync(
      join(testDir, "src", "services", "taskB.ts"),
      `export function doB() { return "B"; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Merges taskA and taskB into taskCombined.ts", () => {
    const plan = engine.mergeModules({
      sourceFiles: ["src/services/taskA.ts", "src/services/taskB.ts"],
      destinationFile: "src/services/taskCombined.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.destinationFile).toBe("src/services/taskCombined.ts");
    expect(plan.patchOperations.some(p => p.operationKind === "INSERT_DECLARATION")).toBe(true);
  });
});
