/**
 * ContractRefactoringPreview Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Side-effect-free preview generation with unified diffs
 * - Zero disk mutation during preview
 * - Immutability check and PLAN_STALE detection on disk drift
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractRefactoringPreviewEngine } from "../contract-refactoring/contract-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ContractRefactoringPreviewEngine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-contract-preview-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string) { return { id, title }; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport const run = updateTask("1", "T");\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preview generates unified diffs with ZERO disk modification", () => {
    const beforeSrv = readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8");
    const beforeCtrl = readFileSync(join(testDir, "src", "controllers", "taskController.ts"), "utf8");

    const preview = ContractRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "SERVICE_CONTRACT_CHANGE",
      sourceFile: "src/services/taskService.ts",
      targetSymbol: "updateTask",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    expect(preview.status).toBe("READY");
    expect(preview.fileDiffs.length).toBe(2);
    expect(preview.diffSummary.filesChanged).toBe(2);

    // Invariant: Disk files must remain untouched
    expect(readFileSync(join(testDir, "src", "services", "taskService.ts"), "utf8")).toBe(beforeSrv);
    expect(readFileSync(join(testDir, "src", "controllers", "taskController.ts"), "utf8")).toBe(beforeCtrl);
  });

  it("TEST 2: verifyImmutability detects disk drift and flags PLAN_STALE", () => {
    const preview = ContractRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "SERVICE_CONTRACT_CHANGE",
      sourceFile: "src/services/taskService.ts",
      targetSymbol: "updateTask",
      parameters: [{ name: "priority", type: "string", defaultValue: '"NORMAL"' }],
    });

    const checkInitial = ContractRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkInitial.valid).toBe(true);

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "controllers", "taskController.ts"), `/* drift */\n`, "utf8");

    const checkAfter = ContractRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkAfter.valid).toBe(false);
    expect(checkAfter.error).toContain("PLAN_STALE");
  });
});
