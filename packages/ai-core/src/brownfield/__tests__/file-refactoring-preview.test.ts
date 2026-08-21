/**
 * FileRefactoringPreview Test Suite — Aegis V2.3 Project 2 Phase 5
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
import { FileRefactoringPreviewEngine } from "../file-refactoring/file-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("FileRefactoringPreviewEngine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-file-preview-");

    writeFileSync(
      join(testDir, "src", "service.ts"),
      `export function execute() { return 1; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controller.ts"),
      `import { execute } from "./service.js";\nexport const run = execute();\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preview generates unified diffs with ZERO disk modification", () => {
    const beforeService = readFileSync(join(testDir, "src", "service.ts"), "utf8");
    const beforeController = readFileSync(join(testDir, "src", "controller.ts"), "utf8");

    const preview = FileRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/service.ts",
      targetPath: "src/taskService.ts",
    });

    expect(preview.status).toBe("READY");
    expect(preview.fileDiffs.length).toBe(1);
    expect(preview.diffSummary.filesChanged).toBe(1);

    // Invariant: Disk files must remain untouched
    expect(readFileSync(join(testDir, "src", "service.ts"), "utf8")).toBe(beforeService);
    expect(readFileSync(join(testDir, "src", "controller.ts"), "utf8")).toBe(beforeController);
  });

  it("TEST 2: verifyImmutability detects disk drift and flags PLAN_STALE", () => {
    const preview = FileRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "FILE_RENAME",
      sourcePath: "src/service.ts",
      targetPath: "src/taskService.ts",
    });

    const checkInitial = FileRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkInitial.valid).toBe(true);

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "controller.ts"), `import { execute } from "./service.js";\n/* drift */\n`, "utf8");

    const checkAfter = FileRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkAfter.valid).toBe(false);
    expect(checkAfter.error).toContain("PLAN_STALE");
  });
});
