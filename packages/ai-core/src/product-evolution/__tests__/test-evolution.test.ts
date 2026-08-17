import { describe, it, expect } from "vitest";
import { TestEvolutionEngine } from "../test-evolution-engine.js";

describe("AEGIS Phase 56 — Test Evolution Engine", () => {
  it("runs 3-tier test matrix (new features, affected features, regression)", () => {
    const report = TestEvolutionEngine.runTests();
    expect(report.isAllPassed).toBe(true);
    expect(report.totalTests).toBe(48);
    expect(report.regressionDetected).toBe(false);
  });

  it("detects regression when existing core tests fail", () => {
    const report = TestEvolutionEngine.runTests({ simulateRegression: true });
    expect(report.isAllPassed).toBe(false);
    expect(report.regressionDetected).toBe(true);
  });
});
