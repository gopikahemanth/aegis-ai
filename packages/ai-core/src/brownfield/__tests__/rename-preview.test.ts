/**
 * RenamePreviewEngine Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Side-effect free: Zero file mutation and zero branch creation during preview
 * - Unified diffs and diff summary generation
 * - Immutability verification and PLAN_STALE detection on disk drift
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RenamePreviewEngine } from "../refactoring/rename-preview-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RenamePreviewEngine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-preview-");

    writeFileSync(join(testDir, "src", "math.ts"),
      `export function calculate(x: number) { return x * 2; }\n`, "utf8");

    writeFileSync(join(testDir, "src", "app.ts"),
      `import { calculate } from "./math.js";\nexport function run() { return calculate(5); }\n`, "utf8");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preview generates diffs with ZERO disk mutation", () => {
    const mathBefore = readFileSync(join(testDir, "src", "math.ts"), "utf8");
    const appBefore = readFileSync(join(testDir, "src", "app.ts"), "utf8");

    const preview = RenamePreviewEngine.generatePreview({
      projectPath: testDir,
      sourceFile: "src/math.ts",
      symbolName: "calculate",
      newName: "computeTotal",
    });

    // Verify preview properties
    expect(preview.status).toBe("READY");
    expect(preview.isApplyAllowed).toBe(true);
    expect(preview.fileDiffs.length).toBe(2);
    expect(preview.diffSummary.filesChanged).toBe(2);

    // Invariant: Disk files must remain 100% UNCHANGED
    const mathAfter = readFileSync(join(testDir, "src", "math.ts"), "utf8");
    const appAfter = readFileSync(join(testDir, "src", "app.ts"), "utf8");
    expect(mathAfter).toBe(mathBefore);
    expect(appAfter).toBe(appBefore);
  });

  it("TEST 2: verifyImmutability detects disk changes and flags PLAN_STALE", () => {
    const preview = RenamePreviewEngine.generatePreview({
      projectPath: testDir,
      sourceFile: "src/math.ts",
      symbolName: "calculate",
      newName: "computeTotal",
    });

    const checkInitial = RenamePreviewEngine.verifyImmutability(preview, testDir);
    expect(checkInitial.valid).toBe(true);

    // Mutate a required file on disk
    writeFileSync(join(testDir, "src", "math.ts"),
      `export function calculate(x: number) { return x * 3; /* edited */ }\n`, "utf8");

    const checkAfterDrift = RenamePreviewEngine.verifyImmutability(preview, testDir);
    expect(checkAfterDrift.valid).toBe(false);
    expect(checkAfterDrift.error).toContain("PLAN_STALE");
  });
});
