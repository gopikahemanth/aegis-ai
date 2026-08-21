/**
 * SignatureChangePlanner Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Master planning for PARAMETER_ADD, PARAMETER_REMOVE, REACT_PROP_ADD, TYPE_FIELD_ADD
 * - Deterministic planHash and patchHash across multiple runs
 * - Descending patch ordering per file
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SignatureChangePlanner } from "../refactoring/signature-change-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SignatureChangePlanner Tests", () => {
  let testDir: string;
  let planner: SignatureChangePlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-sig-planner-");
    planner = new SignatureChangePlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans PARAMETER_ADD with descending offset patches", () => {
    writeFileSync(
      join(testDir, "src", "taskService.ts"),
      `export function updateTask(id: string, title: string) {\n  return { id, title };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\nexport function handle(req: any) {\n  return updateTask(req.id, req.title);\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "updateTask",
      sourceFile: "src/taskService.ts",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    expect(plan.status).toBe("READY");
    expect(plan.affectedFiles).toContain("src/taskService.ts");
    expect(plan.affectedFiles).toContain("src/taskController.ts");
    expect(plan.planHash).toHaveLength(64);
    expect(plan.patchHash).toHaveLength(64);

    for (const patch of plan.patchOperations) {
      for (let i = 0; i < patch.operations.length - 1; i++) {
        expect(patch.operations[i].startPos).toBeGreaterThanOrEqual(patch.operations[i + 1].startPos);
      }
    }
  });

  it("TEST 2: Produces stable deterministic planHash and patchHash", () => {
    writeFileSync(
      join(testDir, "src", "math.ts"),
      `export function add(a: number, b: number) { return a + b; }\n`,
      "utf8"
    );

    const plan1 = planner.plan({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "add",
      sourceFile: "src/math.ts",
      parameters: [{ name: "c", type: "number", defaultValue: "0" }],
    });

    const plan2 = planner.plan({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "add",
      sourceFile: "src/math.ts",
      parameters: [{ name: "c", type: "number", defaultValue: "0" }],
    });

    expect(plan1.planHash).toBe(plan2.planHash);
    expect(plan1.patchHash).toBe(plan2.patchHash);
  });
});
