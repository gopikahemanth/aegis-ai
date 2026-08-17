import { describe, it, expect } from "vitest";
import { GovernanceRiskForecaster } from "../governance-risk-forecaster.js";

describe("AEGIS Phase 31 — Governance Risk Forecaster", () => {
  it("forecasts potential future governance bottlenecks strictly classified as FORECAST", () => {
    const forecast = GovernanceRiskForecaster.forecastRisk("org_core", "AUTHORIZATION_BOTTLENECK", 65, 30);
    expect(forecast.classification).toBe("FORECAST");
    expect(forecast.probabilityPercentage).toBe(65);
    expect(forecast.riskCategory).toBe("AUTHORIZATION_BOTTLENECK");
  });
});
