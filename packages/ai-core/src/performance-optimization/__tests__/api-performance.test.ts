import { describe, it, expect } from "vitest";
import { ApiPerformanceEngine } from "../api-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — API Performance Engine", () => {
  it("traces latency distribution and isolates slowest bottleneck endpoint", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = ApiPerformanceEngine.analyzeApi(baseline);

    expect(report.isApiPerformanceHealthy).toBe(false);
    expect(report.slowestEndpoint).toBe("/api/dashboard/stats");
    const dashboard = report.endpoints.find((e) => e.endpoint === "/api/dashboard/stats");
    expect(dashboard?.p95Ms).toBe(1850);
    expect(dashboard?.bottleneckLayer).toBe("DATABASE");
  });
});
