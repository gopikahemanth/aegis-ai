import { describe, it, expect } from "vitest";
import { PerformanceAcceptanceEngine } from "../performance-acceptance-engine.js";

const allPassCriteria = {
  baselineCaptured: true,
  frontendAnalyzed: true,
  backendAnalyzed: true,
  databaseAnalyzed: true,
  apiAnalyzed: true,
  networkAnalyzed: true,
  assetsAnalyzed: true,
  resourcesAnalyzed: true,
  bottlenecksDiagnosed: true,
  optimizationsApplied: true,
  buildPasses: true,
  functionalRegressionPasses: true,
  securityPreserved: true,
  browserPreserved: true,
  productionVerified: true,
  criticalRegressionsCount: 0,
};

describe("AEGIS Phase 59 — Performance Acceptance Engine", () => {
  it("accepts product when all 16 performance criteria pass with zero critical regressions", () => {
    const res = PerformanceAcceptanceEngine.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(16);
    expect(res.passedCriteria).toBe(16);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("blocks acceptance when functional regression is introduced during optimization", () => {
    const res = PerformanceAcceptanceEngine.evaluate({
      ...allPassCriteria,
      functionalRegressionPasses: false,
      criticalRegressionsCount: 1,
    });

    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.length).toBeGreaterThan(0);
    expect(res.summary).toContain("PERFORMANCE BLOCKED");
  });
});
