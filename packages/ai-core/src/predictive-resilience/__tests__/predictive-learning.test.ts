import { describe, it, expect } from "vitest";
import { PredictiveResilienceLearningEngine } from "../predictive-resilience-learning.js";

describe("AEGIS Phase 29 — Predictive Resilience Learning Engine", () => {
  it("calibrates model lead times without modifying safety policies", () => {
    const report = PredictiveResilienceLearningEngine.calibrate("proj_core", 60, 55);
    expect(report.predictionAccuracy).toBeGreaterThanOrEqual(90);
    expect(report.policyMutationsAttempted).toBe(0);
  });
});
