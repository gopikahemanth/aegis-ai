import { describe, it, expect, beforeEach } from "vitest";
import { PredictiveFailureEngine } from "../predictive-failure-engine.js";

describe("AEGIS Phase 29 — Predictive Failure Engine", () => {
  beforeEach(() => {
    PredictiveFailureEngine.reset();
  });

  it("forecasts potential failure risks strictly classified as PREDICTED", () => {
    const forecast = PredictiveFailureEngine.forecastFailure(
      "proj_core",
      "MEMORY_CREEP",
      75,
      45,
      "Perform rolling container restart"
    );

    expect(forecast.classification).toBe("PREDICTED");
    expect(forecast.probabilityPercentage).toBe(75);
    expect(forecast.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
