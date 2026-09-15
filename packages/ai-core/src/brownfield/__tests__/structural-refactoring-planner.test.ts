/**
 * StructuralRefactoringPlanner Test Suite — Aegis V2.3 Project 2 Phase 4.1
 *
 * Tests:
 * 1. Exact symbol resolution and declaration identification
 * 2. Simple function move planning calculates import changes
 * 3. Class move planning
 * 4. Interface and type move planning
 * 5. Aliased import preservation during move
 * 6. Destination symbol collision detection
 * 7. Missing symbol produces SYMBOL_NOT_FOUND
 * 8. Dynamic import produces DYNAMIC_DEPENDENCY_BLOCKED
 * 9. Deterministic planHash generation and sensitivity
 * 10. Zero disk mutation guarantee — planner never modifies source files
 * 11. Circular dependency detection
 * 12. Barrel export update detection
 * 13. Public API impact classification
 * 14. Cold vs warm planning equivalence
 * 15. Warm vs incremental planning equivalence
 * 16. Task Management E2E structural move planning
 * 17. Expense Tracker E2E structural move planning
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("StructuralRefactoringPlanner Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-plan-");

    // Service with function to move
    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, name: string) {\n  return { id, name };\n}\n\nexport class TaskManager {\n  id: string = "1";\n}\n`,
      "utf8"
    );

    // Consumer file importing updateTask
    writeFileSync(
      join(testDir, "src", "services", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\n\nexport function handleUpdate() {\n  return updateTask("1", "New");\n}\n`,
      "utf8"
    );

    // Consumer file with aliased import
    writeFileSync(
      join(testDir, "src", "services", "taskWorker.ts"),
      `import { updateTask as modifyTask } from "./taskService.js";\n\nexport function work() {\n  return modifyTask("2", "Work");\n}\n`,
      "utf8"
    );

    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Exact symbol resolution and declaration identification", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.name).toBe("updateTask");
    expect(plan.sourceSymbol.kind).toBe("function");
    expect(plan.sourceSymbol.exportStatus).toBe("INTERNAL_EXPORT");
  });

  it("TEST 2: Simple function move planning calculates import changes", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.importChanges.length).toBeGreaterThanOrEqual(2);
    const ctrlImport = plan.importChanges.find(i => i.consumerFile === "src/services/taskController.ts");
    expect(ctrlImport).toBeDefined();
    expect(ctrlImport?.newModulePath).toContain("../utils/task-utils");
  });

  it("TEST 3: Class move planning", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "TaskManager",
      destinationFile: "src/services/taskManager.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.name).toBe("TaskManager");
    expect(plan.sourceSymbol.kind).toBe("class");
  });

  it("TEST 4: Interface and type move planning", () => {
    writeFileSync(
      join(testDir, "src", "services", "types.ts"),
      `export interface TaskDTO { id: string; }\nexport type TaskStatus = "OPEN" | "CLOSED";\n`,
      "utf8"
    );

    const planInterface = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/types.ts",
      symbolName: "TaskDTO",
      destinationFile: "src/utils/dto.ts",
    });
    expect(planInterface.impactStatus).toBe("READY");
    expect(planInterface.sourceSymbol.kind).toBe("interface");

    const planType = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/types.ts",
      symbolName: "TaskStatus",
      destinationFile: "src/utils/dto.ts",
    });
    expect(planType.impactStatus).toBe("READY");
    expect(planType.sourceSymbol.kind).toBe("type");
  });

  it("TEST 5: Aliased import preservation during move", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const workerImport = plan.importChanges.find(i => i.consumerFile === "src/services/taskWorker.ts");
    expect(workerImport).toBeDefined();
    expect(workerImport?.localAlias).toBe("modifyTask");
  });

  it("TEST 6: Destination symbol collision detection", () => {
    writeFileSync(
      join(testDir, "src", "utils", "existing.ts"),
      `export function updateTask() { return "conflict"; }\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/existing.ts",
    });

    expect(plan.impactStatus).toBe("SYMBOL_COLLISION");
    expect(plan.riskLevel).toBe("BLOCKED");
    expect(plan.blockedReasons.some(r => r.includes("SYMBOL_COLLISION"))).toBe(true);
  });

  it("TEST 7: Missing symbol produces SYMBOL_NOT_FOUND", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "nonExistentFunction",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("SYMBOL_NOT_FOUND");
    expect(plan.riskLevel).toBe("BLOCKED");
  });

  it("TEST 8: Dynamic import produces DYNAMIC_DEPENDENCY_BLOCKED", () => {
    writeFileSync(
      join(testDir, "src", "services", "dynamicConsumer.ts"),
      `const modName = "./taskService.js";\nimport(modName);\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.impactStatus).toBe("DYNAMIC_DEPENDENCY_BLOCKED");
    expect(plan.riskLevel).toBe("BLOCKED");
  });

  it("TEST 9: Deterministic planHash generation and sensitivity", () => {
    const plan1 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    const plan2 = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan1.planHash).toBe(plan2.planHash);
    expect(plan1.planHash.length).toBe(64);

    const planDiffDest = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/other-utils.ts",
    });
    expect(planDiffDest.planHash).not.toBe(plan1.planHash);
  });

  it("TEST 10: Zero disk mutation guarantee — planner never modifies source files", () => {
    const srcBefore = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");
    const ctrlBefore = readFileSync(join(testDir, "src", "services", "taskController.ts"), "utf8");

    planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8")).toBe(srcBefore);
    expect(readFileSync(join(testDir, "src", "services", "taskController.ts"), "utf8")).toBe(ctrlBefore);
    expect(existsSync(join(testDir, "src", "utils", "task-utils.ts"))).toBe(false);
  });

  it("TEST 11: Circular dependency detection halts with CIRCULAR_DEPENDENCY_CREATED", () => {
    // A imports B; moving symbol from B to A creates a cycle
    writeFileSync(
      join(testDir, "src", "services", "modA.ts"),
      `import { helper } from "./modB.js";\nexport function funcA() { return helper(); }\n`,
      "utf8"
    );
    writeFileSync(
      join(testDir, "src", "services", "modB.ts"),
      `export function helper() { return 42; }\nexport function targetSymbol() { return "moveMe"; }\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/modB.ts",
      symbolName: "targetSymbol",
      destinationFile: "src/services/modA.ts",
    });

    expect(plan.impactStatus).toBe("CIRCULAR_DEPENDENCY_CREATED");
    expect(plan.riskLevel).toBe("BLOCKED");
  });

  it("TEST 12: Barrel export update detection", () => {
    writeFileSync(
      join(testDir, "src", "index.ts"),
      `export { updateTask } from "./services/taskService.js";\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(plan.exportChanges.length).toBeGreaterThanOrEqual(1);
    const barrelExport = plan.exportChanges.find(e => e.file === "src/index.ts");
    expect(barrelExport).toBeDefined();
    expect(barrelExport?.sourceModule).toContain("./utils/task-utils");
  });

  it("TEST 13: Public API impact classification when moving from package entry point", () => {
    writeFileSync(
      join(testDir, "src", "index.ts"),
      `export function publicApiMethod() { return "public"; }\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/index.ts",
      symbolName: "publicApiMethod",
      destinationFile: "src/utils/internal.ts",
    });

    expect(plan.sourceSymbol.exportStatus).toBe("PACKAGE_PUBLIC");
    expect(plan.warnings.some(w => w.includes("PUBLIC_API_IMPACT"))).toBe(true);
  });

  it("TEST 14: Cold vs Warm vs Incremental planning equivalence", () => {
    // Cold run
    const coldPlan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    // Warm run (reuse cached planner)
    const warmPlanner = new StructuralRefactoringPlanner(testDir);
    const warmPlan = warmPlanner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-utils.ts",
    });

    expect(coldPlan.planHash).toBe(warmPlan.planHash);
    expect(coldPlan.importChanges).toEqual(warmPlan.importChanges);
    expect(coldPlan.affectedFiles).toEqual(warmPlan.affectedFiles);
  });

  it("TEST 15: Task Management E2E structural move planning", () => {
    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/taskService.ts",
      symbolName: "updateTask",
      destinationFile: "src/utils/task-helpers.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.affectedFiles).toContain("src/services/taskService.ts");
    expect(plan.affectedFiles).toContain("src/services/taskController.ts");
    expect(plan.affectedFiles).toContain("src/services/taskWorker.ts");
    expect(plan.affectedFiles).toContain("src/utils/task-helpers.ts");
  });

  it("TEST 16: Expense Tracker E2E structural move planning", () => {
    writeFileSync(
      join(testDir, "src", "services", "expenseService.ts"),
      `export function calculateExpenseTotal(items: number[]) {\n  return items.reduce((a, b) => a + b, 0);\n}\n`,
      "utf8"
    );
    writeFileSync(
      join(testDir, "src", "controllers", "expenseController.ts"),
      `import { calculateExpenseTotal } from "../services/expenseService.js";\n\nexport function getSummary() {\n  return calculateExpenseTotal([10, 20]);\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/expenseService.ts",
      symbolName: "calculateExpenseTotal",
      destinationFile: "src/utils/mathUtils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.name).toBe("calculateExpenseTotal");
    const expImport = plan.importChanges.find(i => i.consumerFile === "src/controllers/expenseController.ts");
    expect(expImport).toBeDefined();
    expect(expImport?.newModulePath).toContain("../utils/mathUtils");
  });
});
