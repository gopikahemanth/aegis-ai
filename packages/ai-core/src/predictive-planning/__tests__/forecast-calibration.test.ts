import { describe, it, expect } from "vitest";
import { ForecastCalibrationEngine } from "../forecast-calibration-engine.js";

describe("AEGIS Phase 32 — Forecast Calibration Engine", () => {
  it("calibrates forecast accuracy against reality with strictly ZERO safety policy mutations", () => {
    const report = ForecastCalibrationEngine.calibrate("API_LATENCY_P99", 50, 48);
    expect(report.predictionAccuracyPercentage).toBeGreaterThanOrEqual(95);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.confidenceCalibrationFactor).toBeGreaterThan(0.9);
  });
});
