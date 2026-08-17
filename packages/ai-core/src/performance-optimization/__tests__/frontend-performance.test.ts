import { describe, it, expect } from "vitest";
import { FrontendPerformanceEngine } from "../frontend-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Frontend Performance Engine", () => {
  it("identifies code-splitting and bundle reduction opportunities from baseline", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = FrontendPerformanceEngine.analyzeFrontend(baseline);

    expect(report.isOptimized).toBe(false);
    expect(report.opportunities.length).toBeGreaterThanOrEqual(2);
    expect(report.potentialBundleReductionKb).toBeGreaterThan(400);
  });
});
