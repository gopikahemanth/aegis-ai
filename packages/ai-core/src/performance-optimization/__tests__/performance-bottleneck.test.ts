import { describe, it, expect } from "vitest";
import { PerformanceBottleneckEngine } from "../performance-bottleneck-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Performance Bottleneck Engine", () => {
  it("correlates multi-signal telemetry to isolate primary root cause", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = PerformanceBottleneckEngine.diagnoseBottlenecks(baseline);

    expect(report.hasBottlenecks).toBe(true);
    expect(report.totalBottlenecks).toBe(4);
    expect(report.primaryBottleneck.category).toBe("DATABASE_QUERY_PATTERN");
    expect(report.primaryBottleneck.confidence).toBeGreaterThan(0.95);
  });
});
