import { describe, it, expect } from "vitest";
import { ResilienceLearningEngine } from "../resilience-learning-engine.js";

describe("AEGIS Phase 28 — Resilience Learning Engine", () => {
  it("calibrates resilience learning without mutating safety policies", () => {
    const report = ResilienceLearningEngine.evaluateLearning("proj_core", 120, 110);
    expect(report.classification).toBe("CONFIRMED");
    expect(report.predictionAccuracyRate).toBeGreaterThanOrEqual(90);
    expect(report.policyMutationsAttempted).toBe(0);
  });
});
