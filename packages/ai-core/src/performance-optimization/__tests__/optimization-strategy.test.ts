import { describe, it, expect } from "vitest";
import { OptimizationStrategyEngine } from "../optimization-strategy-engine.js";
import { PerformanceBottleneckEngine } from "../performance-bottleneck-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Optimization Strategy Engine", () => {
  it("ranks candidate strategies by expected improvement, risk, and rollback ease", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const diagnosis = PerformanceBottleneckEngine.diagnoseBottlenecks(baseline);
    const plan = OptimizationStrategyEngine.planOptimizations(diagnosis);

    expect(plan.rankedStrategies.length).toBe(4);
    expect(plan.selectedStrategies[0].type).toBe("QUERY_BATCHING");
    expect(plan.selectedStrategies[0].score).toBeGreaterThan(90);
    expect(plan.totalEstimatedLatencyReductionPercent).toBeGreaterThanOrEqual(60);
  });
});
