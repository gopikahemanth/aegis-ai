import { describe, it, expect } from "vitest";
import { ReliabilityForecaster } from "../reliability-forecaster.js";

describe("AEGIS Phase 17 — Predictive Reliability Forecasting", () => {
  it("forecasts LOW breach risk when error budget is high and incidents are zero", () => {
    const forecast = ReliabilityForecaster.forecast("gym_proj", 98, 0);
    expect(forecast.sloBreachRisk).toBe("LOW");
    expect(forecast.incidentLikelihoodPercent).toBeLessThan(10);
  });

  it("forecasts HIGH breach risk when error budget is low or incident frequency is elevated", () => {
    const forecast = ReliabilityForecaster.forecast("gym_proj", 45, 3);
    expect(forecast.sloBreachRisk).toBe("HIGH");
    expect(forecast.incidentLikelihoodPercent).toBeGreaterThan(70);
  });
});
