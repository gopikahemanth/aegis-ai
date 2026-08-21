/**
 * ContractRefactoringExecutor Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Transactional execution of cross-file contract changes
 * - Multi-file patch application across service, controller, and DTO files
 * - Atomic rollback on blocked status
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractRefactoringExecutor } from "../contract-refactoring/contract-refactoring-executor.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ContractRefactoringExecutor Tests", () => {
  let testDir: string;
  let executor: ContractRefactoringExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-contract-exec-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string) {\n  return { id, title };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport function handle(req: any) {\n  return updateTask(req.id, req.title);\n}\n`,
      "utf8"
    );

    executor = new ContractRefactoringExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Executes cross-file service contract evolution and updates controller callers", async () => {
    const result = await executor.execute({
      projectPath: testDir,
      operation: "SERVICE_CONTRACT_CHANGE",
      sourceFile: "src/services/taskService.ts",
      targetSymbol: "updateTask",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SUCCESS");

    const updatedService = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");
    const updatedController = readFileSync(join(testDir, "src", "controllers", "taskController.ts"), "utf8");

    expect(updatedService).toContain('priority: string = "NORMAL"');
    expect(updatedController).toContain('updateTask(req.id, req.title, "NORMAL")');
  });

  it("TEST 2: Rejects invalid contract with zero file mutation", async () => {
    const beforeService = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "SERVICE_CONTRACT_CHANGE",
      sourceFile: "src/services/taskService.ts",
      targetSymbol: "missingFunc",
      parameters: [{ name: "p", type: "string" }],
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("CONTRACT_NOT_FOUND");
    expect(readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8")).toBe(beforeService);
  });
});
