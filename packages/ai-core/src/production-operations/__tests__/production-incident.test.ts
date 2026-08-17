import { describe, it, expect } from "vitest";
import { ProductionIncidentDetector } from "../production-incident-detector.js";
import { ProductionAnomalyDetector } from "../production-anomaly-detector.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Incident Detector", () => {
  it("correlates multiple anomalous signals into SEV1 incident", () => {
    const state = ProductionStateEngine.captureState({
      simulateCritical: ["database", "backend"],
      customMetrics: { errorRatePercentage: 7.2, p95LatencyMs: 950 },
    });
    const anomalies = ProductionAnomalyDetector.detect(state);
    const incident = ProductionIncidentDetector.evaluate(state, anomalies);

    expect(incident).not.toBeNull();
    expect(incident?.severity).toBe("SEV1_CRITICAL");
    expect(incident?.state).toBe("DETECTED");
    expect(incident?.correlatedSignals.length).toBeGreaterThanOrEqual(2);
    expect(incident?.affectedComponents.length).toBeGreaterThanOrEqual(1);
  });

  it("returns null when no anomalies exist", () => {
    const state = ProductionStateEngine.captureState();
    const anomalies = ProductionAnomalyDetector.detect(state);
    const incident = ProductionIncidentDetector.evaluate(state, anomalies);
    expect(incident).toBeNull();
  });
});
