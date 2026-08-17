import { describe, it, expect } from "vitest";
import { OptimizationImpactEngine } from "../optimization-impact-engine.js";
import { OptimizationStrategyEngine } from "../optimization-strategy-engine.js";
import { PerformanceBottleneckEngine } from "../performance-bottleneck-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Optimization Impact Engine", () => {
  it("evaluates blast radius and confirms zero security control compromises", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const diagnosis = PerformanceBottleneckEngine.diagnoseBottlenecks(baseline);
    const plan = OptimizationStrategyEngine.planOptimizations(diagnosis);
    const impact = OptimizationImpactEngine.analyzeImpact(plan);

    expect(impact.overallImpactSeverity).toBe("LOW");
    expect(impact.securityControlsAffected).toBe(false);
    expect(impact.affectedFiles.length).toBe(4);
  });
});
