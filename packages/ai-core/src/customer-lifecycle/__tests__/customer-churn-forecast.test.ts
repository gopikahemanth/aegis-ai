import { describe, it, expect } from "vitest";
import { CustomerChurnForecastEngine } from "../customer-churn-forecast.js";

describe("AEGIS Phase 38 — Customer Churn Forecast Engine", () => {
  it("forecasts churn probability and explicitly tags prediction as FORECAST", () => {
    const report = CustomerChurnForecastEngine.forecastChurn("cust_1", "proj_gym", 88, 1, "30_DAYS");
    expect(report.isForecast).toBe(true);
    expect(report.riskLevel).toBe("LOW");
    expect(report.churnProbabilityPercentage).toBeLessThan(25);
  });

  it("forecasts CRITICAL churn risk when health score is severely low and inactivity is prolonged", () => {
    const report = CustomerChurnForecastEngine.forecastChurn("cust_at_risk", "proj_gym", 30, 21, "30_DAYS");
    expect(report.isForecast).toBe(true);
    expect(report.riskLevel).toBe("CRITICAL");
    expect(report.primaryRiskDrivers.length).toBeGreaterThan(0);
  });
});
