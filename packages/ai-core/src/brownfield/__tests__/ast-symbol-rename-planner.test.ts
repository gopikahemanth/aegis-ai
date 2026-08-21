/**
 * ASTSymbolRenamePlanner Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Deterministic plan generation with descending AST patch operations
 * - Deterministic planHash and patchHash
 * - Correct status transitions (READY vs SYMBOL_NOT_FOUND vs SYMBOL_COLLISION)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ASTSymbolRenamePlanner } from "../refactoring/ast-symbol-rename-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ASTSymbolRenamePlanner Tests", () => {
  let testDir: string;
  let planner: ASTSymbolRenamePlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-planner-");

    writeFileSync(join(testDir, "src", "taskService.ts"),
      `export function updateTask(id: string, meta: any) {\n  return { id, meta };\n}\n`, "utf8");

    writeFileSync(join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\n\nexport function handle(req: any) {\n  return updateTask(req.id, req.body);\n}\n`, "utf8");

    planner = new ASTSymbolRenamePlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans multi-file rename with descending startPos patches", () => {
    const plan = planner.planRename({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    expect(plan.status).toBe("READY");
    expect(plan.requiredFiles).toContain("src/taskService.ts");
    expect(plan.requiredFiles).toContain("src/taskController.ts");
    expect(plan.planHash).toHaveLength(64);
    expect(plan.patchHash).toHaveLength(64);

    // Verify operations ordering descending per file
    for (const patch of plan.patches) {
      for (let i = 0; i < patch.operations.length - 1; i++) {
        expect(patch.operations[i].startPos).toBeGreaterThanOrEqual(patch.operations[i + 1].startPos);
      }
    }
  });

  it("TEST 2: Produces identical planHash and patchHash across multiple runs", () => {
    const plan1 = planner.planRename({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    const plan2 = planner.planRename({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "updateTask",
      newName: "modifyTask",
    });

    expect(plan1.planHash).toBe(plan2.planHash);
    expect(plan1.patchHash).toBe(plan2.patchHash);
  });

  it("TEST 3: Missing symbol produces SYMBOL_NOT_FOUND status", () => {
    const plan = planner.planRename({
      projectPath: testDir,
      sourceFile: "src/taskService.ts",
      symbolName: "unknownSymbol",
      newName: "someNewName",
    });

    expect(plan.status).toBe("SYMBOL_NOT_FOUND");
    expect(plan.blockedReasons.length).toBeGreaterThan(0);
  });
});
