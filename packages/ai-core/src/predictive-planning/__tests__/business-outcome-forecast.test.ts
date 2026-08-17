import { describe, it, expect } from "vitest";
import { BusinessOutcomeForecaster } from "../business-outcome-forecaster.js";

describe("AEGIS Phase 32 — Business Outcome Forecaster", () => {
  it("forecasts outcome probability strictly classified as FORECAST", () => {
    const forecast = BusinessOutcomeForecaster.forecastOutcome(
      "out_rev_growth",
      "proj_core",
      "Q3 Member Retention Rate >= 95%",
      92,
      45
    );

    expect(forecast.classification).toBe("FORECAST");
    expect(forecast.status).toBe("LIKELY_ACHIEVED");
    expect(forecast.achievementProbabilityPercentage).toBe(92);
  });
});
