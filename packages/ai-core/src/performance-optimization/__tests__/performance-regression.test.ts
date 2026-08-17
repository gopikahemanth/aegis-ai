import { describe, it, expect } from "vitest";
import { PerformanceRegressionEngine } from "../performance-regression-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Performance Regression Engine", () => {
  it("computes exact before/after percentage improvements across all metrics", () => {
    const before = PerformanceBaselineEngine.captureBaseline("GymMaster Pro", { hasDegradedPerformance: true });
    const after = PerformanceBaselineEngine.captureBaseline("GymMaster Pro", { hasDegradedPerformance: false });

    const report = PerformanceRegressionEngine.compare(before, after);

    expect(report.isOverallImproved).toBe(true);
    expect(report.averageImprovementPercent).toBeGreaterThanOrEqual(50);
    expect(report.comparisons.length).toBe(5);

    const apiComp = report.comparisons.find((c) => c.metricName.includes("Dashboard"));
    expect(apiComp?.improvementPercent).toBe(78);
  });
});
