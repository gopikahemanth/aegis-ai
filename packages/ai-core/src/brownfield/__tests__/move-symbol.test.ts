/**
 * Move Symbol Test Suite — Aegis V2.3 Project 2 Phase 4
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Move Symbol Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;

  beforeEach(() => {
    testDir = makeProject("aegis-move-sym-");
    writeFileSync(
      join(testDir, "src", "services", "authService.ts"),
      `export class AuthManager { login() { return true; } }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Moves class AuthManager to authUtils with correct removal and insertion", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/authService.ts",
      symbolName: "AuthManager",
      destinationFile: "src/utils/authUtils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("class");
    expect(plan.patchOperations.some(p => p.operationKind === "REMOVE_DECLARATION")).toBe(true);
    expect(plan.patchOperations.some(p => p.operationKind === "INSERT_DECLARATION")).toBe(true);
  });
});
