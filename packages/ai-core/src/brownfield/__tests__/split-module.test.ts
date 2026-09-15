/**
 * Split Module Test Suite — Aegis V2.3 Project 2 Phase 5
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

describe("Split Module Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-split-mod-");
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function createTask() { return 1; }\nexport function updateTask() { return 2; }\nexport function deleteTask() { return 3; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Splits taskService into taskCreateService and taskMutationService", () => {
    const plan = engine.splitModule({
      sourceFile: "src/services/taskService.ts",
      groups: [
        { destinationFile: "src/services/taskCreateService.ts", symbolNames: ["createTask"] },
        { destinationFile: "src/services/taskMutationService.ts", symbolNames: ["updateTask", "deleteTask"] },
      ],
      options: { reExportFromSource: true },
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.affectedFiles.length).toBe(3);
    expect(plan.patchOperations.length).toBeGreaterThan(2);
  });
});
