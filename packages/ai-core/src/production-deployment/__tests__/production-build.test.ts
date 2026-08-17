import { describe, it, expect } from "vitest";
import { ProductionBuildEngine } from "../production-build-engine.js";

describe("AEGIS Phase 53 — Production Build Engine", () => {
  it("passes all 6 build steps and produces a build fingerprint", () => {
    const r = ProductionBuildEngine.build("/tmp/project");
    expect(r.isPassed).toBe(true);
    expect(r.buildFingerprint).not.toBe("BUILD_FAILED");
    expect(r.dependenciesInstalled).toBe(true);
    expect(r.typecheckPassed).toBe(true);
    expect(r.lintPassed).toBe(true);
    expect(r.testsPassed).toBe(true);
    expect(r.frontendBundleGenerated).toBe(true);
    expect(r.backendCompiled).toBe(true);
    expect(r.artifactLocations.length).toBe(2);
    expect(r.failedSteps).toHaveLength(0);
  });

  it("fails and blocks deployment when typecheck fails — PRODUCTION BUILD PASS ≠ DEPLOYMENT SUCCESS", () => {
    const r = ProductionBuildEngine.build("/tmp/project", "typecheck");
    expect(r.isPassed).toBe(false);
    expect(r.typecheckPassed).toBe(false);
    expect(r.failedSteps).toContain("TypeCheck");
    expect(r.buildFingerprint).toBe("BUILD_FAILED");
    expect(r.artifactLocations).toHaveLength(0);
  });

  it("fails when tests fail", () => {
    const r = ProductionBuildEngine.build("/tmp/project", "tests");
    expect(r.isPassed).toBe(false);
    expect(r.testsPassed).toBe(false);
    expect(r.failedSteps).toContain("Unit Tests");
  });
});
