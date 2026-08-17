import { describe, it, expect } from "vitest";
import { TechnicalDebtForecastEngine } from "../technical-debt-forecast.js";

describe("AEGIS Phase 23 — Technical Debt Forecasting Engine", () => {
  it("projects future technical debt trajectory and strictly marks predictions as FORECAST", () => {
    const forecast = TechnicalDebtForecastEngine.forecast("proj_core", 25, 2);
    expect(forecast.classification).toBe("FORECAST");
    expect(forecast.forecast30Days).toBeGreaterThan(25);
    expect(forecast.trajectory).toBe("STABLE");
  });
});
