import { describe, it, expect } from "vitest";
import { ExperimentMeasurementEngine } from "../experiment-measurement-engine.js";

describe("AEGIS Phase 40 — Experiment Measurement Engine", () => {
  it("captures empirical telemetry across Technical, Engineering, and Business dimensions", () => {
    const report = ExperimentMeasurementEngine.measureTrial("trial_123", "exp_123", 18, 0.0, 1200);
    expect(report.technicalMetrics.latencyP99Ms).toBe(18);
    expect(report.technicalMetrics.errorRatePct).toBe(0.0);
    expect(report.engineeringMetrics.testStabilityPct).toBe(100);
    expect(report.businessMetrics.realizedValueINR).toBe(240000);
  });
});
