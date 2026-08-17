import { describe, it, expect } from "vitest";
import { AutonomousOptimizationEngine } from "../autonomous-optimization-engine.js";
import { OptimizationStrategyEngine } from "../optimization-strategy-engine.js";
import { PerformanceBottleneckEngine } from "../performance-bottleneck-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Autonomous Optimization Engine", () => {
  it("applies bounded atomic patches with checkpoint capture", async () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const diagnosis = PerformanceBottleneckEngine.diagnoseBottlenecks(baseline);
    const plan = OptimizationStrategyEngine.planOptimizations(diagnosis);

    const report = await AutonomousOptimizationEngine.executeOptimizations(plan);

    expect(report.isOptimized).toBe(true);
    expect(report.totalPatchesApplied).toBe(4);
    expect(report.checkpointId).toContain("chkpt_opt_pass");
    expect(report.requiresRollback).toBe(false);
  });

  it("triggers rollback when an optimization degrades metrics", async () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const diagnosis = PerformanceBottleneckEngine.diagnoseBottlenecks(baseline);
    const plan = OptimizationStrategyEngine.planOptimizations(diagnosis);

    const report = await AutonomousOptimizationEngine.executeOptimizations(plan, {
      simulateFailedOptimization: true,
    });

    expect(report.isOptimized).toBe(false);
    expect(report.requiresRollback).toBe(true);
  });
});
