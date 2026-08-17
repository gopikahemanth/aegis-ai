import { describe, it, expect } from "vitest";
import { EnterpriseForecastEngine } from "../enterprise-forecast-engine.js";

describe("AEGIS Phase 32 — Enterprise Forecast Engine", () => {
  it("generates forecasts strictly classified as FORECAST", () => {
    const forecast = EnterpriseForecastEngine.generateForecast(
      "API_LATENCY_P99",
      45,
      52,
      "7_DAYS",
      ["ev_traffic_trend"]
    );

    expect(forecast.classification).toBe("FORECAST");
    expect(forecast.horizon).toBe("7_DAYS");
    expect(forecast.confidence).toBeGreaterThan(0.9);
  });
});
