import { describe, it, expect } from "vitest";
import { ProductionPerformanceEngine } from "../production-performance-engine.js";

describe("AEGIS Phase 59 — Production Performance Engine", () => {
  it("verifies live production endpoints meet 500ms SLO threshold with zero error rate", async () => {
    const report = await ProductionPerformanceEngine.verifyProductionPerformance("https://aegisgym.com");
    expect(report.isProductionHealthy).toBe(true);
    expect(report.measuredLiveP95Ms).toBeLessThanOrEqual(500);
    expect(report.errorRatePercent).toBe(0.0);
  });

  it("detects when live production latency violates SLO", async () => {
    const report = await ProductionPerformanceEngine.verifyProductionPerformance("https://aegisgym.com", {
      simulateProductionRegression: true,
    });
    expect(report.isProductionHealthy).toBe(false);
    expect(report.measuredLiveP95Ms).toBeGreaterThan(500);
  });
});
