import { describe, it, expect } from "vitest";
import { CapacityDemandForecaster } from "../capacity-demand-forecaster.js";

describe("AEGIS Phase 32 — Capacity & Demand Forecaster", () => {
  it("detects capacity risk when utilization exceeds 80%", () => {
    const report = CapacityDemandForecaster.forecastCapacity("AI_WORKERS", 100, 85);
    expect(report.status).toBe("CAPACITY_RISK");
    expect(report.utilizationPercentage).toBe(85);
    expect(report.headroomUnits).toBe(15);
  });
});
