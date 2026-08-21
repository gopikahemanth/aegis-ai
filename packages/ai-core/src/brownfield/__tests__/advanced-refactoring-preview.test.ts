/**
 * AdvancedRefactoringPreview Test Suite — Aegis V2.3 Project 2 Phase 4
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
import { AdvancedRefactoringPreviewEngine } from "../refactoring/advanced-refactoring-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("AdvancedRefactoringPreviewEngine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-adv-preview-");

    writeFileSync(
      join(testDir, "src", "service.ts"),
      `export function execute(action: string) { return action; }\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Preview generates diffs with ZERO disk modification", () => {
    const before = readFileSync(join(testDir, "src", "service.ts"), "utf8");

    const preview = AdvancedRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "execute",
      sourceFile: "src/service.ts",
      parameters: [{ name: "options", type: "any", defaultValue: "{}" }],
    });

    expect(preview.status).toBe("READY");
    expect(preview.fileDiffs.length).toBe(1);
    expect(preview.diffSummary.filesChanged).toBe(1);

    // Invariant: Disk file must remain 100% untouched
    const after = readFileSync(join(testDir, "src", "service.ts"), "utf8");
    expect(after).toBe(before);
  });

  it("TEST 2: verifyImmutability detects disk drift and flags PLAN_STALE", () => {
    const preview = AdvancedRefactoringPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "PARAMETER_ADD",
      targetSymbol: "execute",
      sourceFile: "src/service.ts",
      parameters: [{ name: "options", type: "any", defaultValue: "{}" }],
    });

    const checkInitial = AdvancedRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkInitial.valid).toBe(true);

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "service.ts"), `export function execute(action: string) { /* drift */ return action; }\n`, "utf8");

    const checkAfter = AdvancedRefactoringPreviewEngine.verifyImmutability(preview, testDir);
    expect(checkAfter.valid).toBe(false);
    expect(checkAfter.error).toContain("PLAN_STALE");
  });
});
