import { describe, it, expect } from "vitest";
import { ProductionDiagnosisEngine } from "../production-diagnosis-engine.js";
import { ProductionIncident } from "../production-incident-detector.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Diagnosis Engine", () => {
  it("determines root cause and recommended action with confidence score", () => {
    const incident: ProductionIncident = {
      incidentId: "inc_test_1",
      title: "Database Outage",
      severity: "SEV1_CRITICAL",
      state: "DETECTED",
      detectedAt: new Date().toISOString(),
      affectedComponents: ["PostgreSQL Database"],
      correlatedSignals: ["High connection latency", "500 Internal errors on CRUD"],
      requiresHumanIntervention: false,
      resolutionAttempts: 0,
      summary: "Database connection pool saturated",
    };

    const state = ProductionStateEngine.captureState({
      simulateCritical: ["database"],
      customMetrics: { errorRatePercentage: 4.5 },
    });

    const diagnosis = ProductionDiagnosisEngine.diagnose(incident, state);

    expect(diagnosis.certainty).toBe("CONFIRMED");
    expect(diagnosis.confidenceScore).toBeGreaterThan(0.9);
    expect(diagnosis.rootCause).toContain("Database connection pool");
    expect(diagnosis.recommendedActionType).toBe("RESTART_DATABASE_POOL");
  });
});
