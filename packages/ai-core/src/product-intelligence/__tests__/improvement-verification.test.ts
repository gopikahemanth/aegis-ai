import { describe, it, expect } from "vitest";
import { ImprovementVerificationEngine } from "../improvement-verification-engine.js";

describe("AEGIS Phase 60 — Improvement Verification Engine", () => {
  it("verifies improvement across 5 distinct system layers", () => {
    const report = ImprovementVerificationEngine.verifyImprovement();
    expect(report.isFullyVerified).toBe(true);
    expect(report.functionalVerified).toBe(true);
    expect(report.securityVerified).toBe(true);
    expect(report.performanceVerified).toBe(true);
    expect(report.uxVerified).toBe(true);
    expect(report.layers.length).toBe(5);
  });

  it("fails verification when regression is detected in business workflow", () => {
    const report = ImprovementVerificationEngine.verifyImprovement({
      simulateVerificationRegression: true,
    });
    expect(report.isFullyVerified).toBe(false);
    expect(report.functionalVerified).toBe(false);
  });
});
