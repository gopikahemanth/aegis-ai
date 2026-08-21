/**
 * FileCollisionAnalyzer Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - SOURCE_NOT_FOUND detection
 * - TARGET_EXISTS collision detection
 * - Windows case-only rename detection
 * - DYNAMIC_REFERENCE_BLOCKED detection
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileCollisionAnalyzer } from "../file-refactoring/file-collision-analyzer.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  return dir;
}

describe("FileCollisionAnalyzer Tests", () => {
  let testDir: string;
  let analyzer: FileCollisionAnalyzer;

  beforeEach(() => {
    testDir = makeProject("aegis-collision-");
    writeFileSync(join(testDir, "src", "TaskCard.tsx"), `export const a = 1;\n`, "utf8");
    writeFileSync(join(testDir, "src", "Existing.tsx"), `export const b = 2;\n`, "utf8");
    analyzer = new FileCollisionAnalyzer(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Flags SOURCE_NOT_FOUND when source file does not exist", () => {
    const res = analyzer.analyze("src/Missing.tsx", "src/Target.tsx");
    expect(res.hasConflicts).toBe(true);
    expect(res.status).toBe("SOURCE_NOT_FOUND");
  });

  it("TEST 2: Flags TARGET_EXISTS when target already exists", () => {
    const res = analyzer.analyze("src/TaskCard.tsx", "src/Existing.tsx");
    expect(res.hasConflicts).toBe(true);
    expect(res.status).toBe("TARGET_EXISTS");
  });

  it("TEST 3: Flags case-only rename on Windows safely", () => {
    const res = analyzer.analyze("src/TaskCard.tsx", "src/taskcard.tsx");
    expect(res.hasConflicts).toBe(false);
    expect(res.isCaseOnlyRename).toBe(true);
  });

  it("TEST 4: Flags DYNAMIC_REFERENCE_BLOCKED when dynamic import is detected", () => {
    const res = analyzer.analyze("src/TaskCard.tsx", "src/NewCard.tsx", ["src/dynamicLoader.ts"]);
    expect(res.hasConflicts).toBe(true);
    expect(res.status).toBe("DYNAMIC_REFERENCE_BLOCKED");
  });
});
