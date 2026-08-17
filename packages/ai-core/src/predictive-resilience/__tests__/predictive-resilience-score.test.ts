import { describe, it, expect } from "vitest";
import { PredictiveResilienceScoreEngine } from "../predictive-resilience-score.js";

describe("AEGIS Phase 29 — Predictive Resilience Score Engine", () => {
  it("calculates multidimensional predictive resilience scores", () => {
    const report = PredictiveResilienceScoreEngine.calculateScore({
      projectId: "proj_core",
      predictionAccuracy: 95,
      recoveryReadiness: 90,
      leadTime: 85,
      failoverReadiness: 95,
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(90);
    expect(report.status).toBe("PREDICTIVE_RESILIENT");
  });
});
