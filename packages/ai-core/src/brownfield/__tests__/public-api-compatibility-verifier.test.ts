/**
 * Public API Compatibility Verifier Test Suite — Aegis V2.3 Project 2 Phase 6
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralTransformationEngine } from "../refactoring/structural-transformation-engine.js";
import { PublicApiCompatibilityVerifier } from "../refactoring/public-api-compatibility-verifier.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Public API Compatibility Verifier Tests", () => {
  let testDir: string;
  let engine: StructuralTransformationEngine;
  let verifier: PublicApiCompatibilityVerifier;

  beforeEach(() => {
    testDir = makeProject("aegis-pub-ver-");
    writeFileSync(
      join(testDir, "src", "index.ts"),
      `export function publicMethod() { return "v1"; }\n`,
      "utf8"
    );
    engine = new StructuralTransformationEngine(testDir);
    verifier = new PublicApiCompatibilityVerifier(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Moving exported symbol from entry point without bridge triggers PUBLIC_API_BREAK", () => {
    const plan = engine.transformMoveSymbol({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/index.ts",
      symbolName: "publicMethod",
      destinationFile: "src/utils/methods.ts",
    });

    const result = verifier.verifyPlan(plan, false);
    expect(result.isPublicApi).toBe(true);
    expect(result.isBreaking).toBe(true);
    expect(result.status).toBe("PUBLIC_API_BREAK");
  });
});
