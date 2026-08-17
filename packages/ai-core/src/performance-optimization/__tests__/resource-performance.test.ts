import { describe, it, expect } from "vitest";
import { ResourcePerformanceEngine } from "../resource-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Resource Performance Engine", () => {
  it("monitors CPU headroom and database connection pool saturation", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = ResourcePerformanceEngine.analyzeResources(baseline);

    expect(report.isResourcesHealthy).toBe(true);
    expect(report.metrics.length).toBe(3);
    const cpuMetric = report.metrics.find((m) => m.resource === "CPU");
    expect(cpuMetric?.status).toBe("PRESSURE");
  });
});
