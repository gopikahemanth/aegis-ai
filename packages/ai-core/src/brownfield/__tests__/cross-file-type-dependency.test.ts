/**
 * Cross-File Type Dependency Test Suite — Aegis V2.3 Project 2 Phase 5
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "types"), { recursive: true });
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Cross-File Type Dependency Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-type-dep-");
    writeFileSync(
      join(testDir, "src", "types", "taskTypes.ts"),
      `export interface TaskItem { id: string; title: string; }\nexport type TaskStatus = "pending" | "done";\n`,
      "utf8"
    );
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `import type { TaskItem } from "../types/taskTypes.js";\nexport function getTask(): TaskItem { return { id: "1", title: "Test" }; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Moves interface TaskItem with type-only import preservation", () => {
    const plan = engine.moveSymbols({
      sourceFile: "src/types/taskTypes.ts",
      symbolNames: ["TaskItem"],
      destinationFile: "src/types/modelTypes.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.symbols?.length).toBe(1);
    expect(plan.patchOperations.some(p => p.operationKind === "INSERT_DECLARATION")).toBe(true);
  });
});
