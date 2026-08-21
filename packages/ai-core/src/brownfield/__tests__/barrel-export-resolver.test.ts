/**
 * BarrelExportResolver Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Barrel re-export module specifier update on file rename
 * - Unrelated barrel exports preservation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BarrelExportResolver } from "../file-refactoring/barrel-export-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("BarrelExportResolver Tests", () => {
  let testDir: string;
  let barrelResolver: BarrelExportResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-barrel-");

    writeFileSync(
      join(testDir, "src", "components", "TaskCard.tsx"),
      `export function TaskCard() { return "Card"; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "Button.tsx"),
      `export function Button() { return "Btn"; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "index.ts"),
      `export * from "./TaskCard.js";\nexport * from "./Button.js";\n`,
      "utf8"
    );

    barrelResolver = new BarrelExportResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans barrel export rewrite for renamed target, preserving unrelated exports", () => {
    const res = barrelResolver.planBarrelUpdates(
      "src/components/index.ts",
      "src/components/TaskCard.tsx",
      "src/components/TaskItem.tsx"
    );

    expect(res.patches.length).toBe(1);
    expect(res.patches[0].originalSnippet).toContain("TaskCard.js");
    expect(res.patches[0].replacementSnippet).toContain("TaskItem.js");
  });
});
