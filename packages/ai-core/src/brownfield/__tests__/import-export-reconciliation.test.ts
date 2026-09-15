/**
 * Import & Export Reconciliation Test Suite — Aegis V2.3 Project 2 Phase 4
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Import & Export Reconciliation Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-imp-exp-rec-");
    writeFileSync(
      join(testDir, "src", "services", "consumer.ts"),
      `import { updateTask } from "./taskService.js";\nexport { updateTask } from "./taskService.js";\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Reconciles import module specifiers", () => {
    const ops = engine.reconcileImports("src/services/consumer.ts", {
      updateSpecifier: [{ oldSpecifier: "./taskService.js", newSpecifier: "./taskUtils.js" }],
    });

    expect(ops.length).toBe(1);
    expect(ops[0].replacement).toBe(`"./taskUtils.js"`);
  });

  it("TEST 2: Reconciles export module specifiers", () => {
    const ops = engine.reconcileExports("src/services/consumer.ts", {
      updateSpecifier: [{ oldSpecifier: "./taskService.js", newSpecifier: "./taskUtils.js" }],
    });

    expect(ops.length).toBe(1);
    expect(ops[0].replacement).toBe(`"./taskUtils.js"`);
  });
});
