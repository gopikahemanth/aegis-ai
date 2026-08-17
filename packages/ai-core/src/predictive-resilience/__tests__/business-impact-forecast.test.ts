import { describe, it, expect } from "vitest";
import { BusinessImpactForecaster } from "../business-impact-forecaster.js";

describe("AEGIS Phase 29 — Business Impact Forecaster", () => {
  it("projects business and revenue impact strictly classified as FORECAST", () => {
    const forecast = BusinessImpactForecaster.forecastImpact("proj_core", 1000, 30);
    expect(forecast.classification).toBe("FORECAST");
    expect(forecast.affectedCustomersCount).toBe(1000);
    expect(forecast.projectedRevenueRiskINR).toBe(135000);
  });
});
