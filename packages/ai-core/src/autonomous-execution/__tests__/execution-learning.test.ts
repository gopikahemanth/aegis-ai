import { describe, it, expect } from "vitest";
import { ExecutionLearningEngine } from "../execution-learning-engine.js";

describe("AEGIS Phase 33 — Execution Learning Engine", () => {
  it("calibrates execution models with strictly ZERO safety policy mutations", () => {
    const report = ExecutionLearningEngine.extractLearning(25, 0.04);
    expect(report.totalExecutionsAnalyzed).toBe(25);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.riskEstimationAccuracy).toBeGreaterThanOrEqual(95);
  });
});
