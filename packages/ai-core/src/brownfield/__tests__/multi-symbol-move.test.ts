/**
 * Multi-Symbol Move Test Suite — Aegis V2.3 Project 2 Phase 5
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Multi-Symbol Move Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-multi-move-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string) { return id; }\nexport function deleteTask(id: string) { return id; }\nexport function createTask(name: string) { return name; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Moves 2 symbols simultaneously to task-utils.ts", () => {
    const plan = engine.moveSymbols({
      sourceFile: "src/services/taskService.ts",
      symbolNames: ["updateTask", "deleteTask"],
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.symbols?.length).toBe(2);
    expect(plan.patchOperations.filter(p => p.operationKind === "REMOVE_DECLARATION").length).toBe(2);
    expect(plan.patchOperations.some(p => p.operationKind === "INSERT_DECLARATION")).toBe(true);
  });

  it("TEST 2: Destination collision halts multi-move with SYMBOL_COLLISION", () => {
    writeFileSync(
      join(testDir, "src", "utils", "task-utils.ts"),
      `export function updateTask() { return "collision"; }\n`,
      "utf8"
    );

    const plan = engine.moveSymbols({
      sourceFile: "src/services/taskService.ts",
      symbolNames: ["updateTask", "createTask"],
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("SYMBOL_COLLISION");
    expect(plan.isApplyAllowed).toBe(false);
  });
});
