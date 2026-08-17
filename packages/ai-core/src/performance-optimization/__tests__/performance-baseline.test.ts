import { describe, it, expect } from "vitest";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Performance Baseline Engine", () => {
  it("captures comprehensive performance baseline telemetry", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    expect(baseline.version).toBe("baseline-unoptimized");
    expect(baseline.database.queryCountPerDashboardLoad).toBe(47);
    expect(baseline.database.hasNPlusOneDetected).toBe(true);
    expect(baseline.api.dashboardLatency.p95Ms).toBe(1850);
    expect(baseline.frontend.jsBundleSizeKb).toBe(1420);
  });
});
