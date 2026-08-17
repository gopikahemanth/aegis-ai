import { describe, it, expect } from "vitest";
import { AnomalyDetector } from "../anomaly-detector.js";

describe("AEGIS Phase 16 — Predictive Anomaly Detection", () => {
  it("detects performance latency anomaly when current latency spikes significantly", () => {
    const report = AnomalyDetector.detect({
      baselineLatencyMs: 20,
      currentLatencyMs: 95, // > 2.5x
    });

    expect(report.detected).toBe(true);
    expect(report.type).toBe("PERFORMANCE_ANOMALY");
    expect(report.severity).toBe("HIGH");
  });

  it("detects resource creep when memory usage grows by 300%", () => {
    const report = AnomalyDetector.detect({
      baselineMemoryMB: 30,
      currentMemoryMB: 120, // 4x
    });

    expect(report.detected).toBe(true);
    expect(report.type).toBe("RESOURCE_ANOMALY");
  });
});
