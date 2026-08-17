import { describe, it, expect } from "vitest";
import { ProductionAnomalyDetector } from "../production-anomaly-detector.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Anomaly Detector", () => {
  it("detects no anomalies when production is operating nominally", () => {
    const state = ProductionStateEngine.captureState();
    const result = ProductionAnomalyDetector.detect(state);
    expect(result.hasAnomalies).toBe(false);
    expect(result.overallSeverity).toBe("NORMAL");
    expect(result.anomalies).toHaveLength(0);
  });

  it("classifies CRITICAL anomaly when 5xx error rate spikes", () => {
    const state = ProductionStateEngine.captureState({
      customMetrics: { errorRatePercentage: 6.8 },
    });
    const result = ProductionAnomalyDetector.detect(state);
    expect(result.hasAnomalies).toBe(true);
    expect(result.overallSeverity).toBe("CRITICAL");
    expect(result.criticalCount).toBeGreaterThanOrEqual(1);
    expect(result.anomalies.some((a) => a.metricName.includes("Error Rate"))).toBe(true);
  });
});
