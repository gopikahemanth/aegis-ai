import { describe, it, expect } from "vitest";
import { EnterpriseReliabilityScoreEngine } from "../enterprise-reliability-score.js";

describe("AEGIS Phase 30 — Enterprise Reliability Score Engine", () => {
  it("calculates multidimensional enterprise reliability and continuity score", () => {
    const report = EnterpriseReliabilityScoreEngine.calculateScore({
      projectId: "proj_core",
      technicalReliability: 100,
      businessContinuity: 100,
      recoveryReadiness: 95,
      predictionAccuracy: 95,
      rtoCompliance: 100,
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(95);
    expect(report.status).toBe("OPTIMIZED");
  });
});
