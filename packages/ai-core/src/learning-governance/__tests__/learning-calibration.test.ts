import { describe, it, expect } from "vitest";
import { LearningCalibrationEngine } from "../learning-calibration-engine.js";

describe("AEGIS Phase 44 — Learning Calibration Engine", () => {
  it("calibrates confidence against verified outcomes while guaranteeing zero safety policy mutations", () => {
    const report = LearningCalibrationEngine.calibrate("Reliability", 0.95, 0.85, 20);

    expect(report.calibrationError).toBe(0.1);
    expect(report.confidenceAdjustment).toBe(-0.05);
    expect(report.safetyPoliciesMutated).toBe(0);
    expect(report.authorizationBypassesAttempted).toBe(0);
    expect(report.tenantIsolationViolations).toBe(0);
  });
});
