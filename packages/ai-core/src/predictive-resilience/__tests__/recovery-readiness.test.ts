import { describe, it, expect } from "vitest";
import { RecoveryReadinessForecaster } from "../recovery-readiness-forecaster.js";

describe("AEGIS Phase 29 — Recovery Readiness Forecaster", () => {
  it("evaluates multidimensional recovery capability readiness", () => {
    const forecast = RecoveryReadinessForecaster.forecastReadiness("proj_core", 95, 90, 95, 90);
    expect(forecast.status).toBe("READY");
    expect(forecast.confidence).toBeGreaterThan(0.9);
  });
});
