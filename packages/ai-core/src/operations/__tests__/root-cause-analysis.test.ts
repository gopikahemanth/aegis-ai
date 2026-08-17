import { describe, it, expect } from "vitest";
import { RootCauseAnalyzer } from "../root-cause-analyzer.js";
import type { IncidentRecord } from "../incident-engine.js";

describe("AEGIS Phase 15 — Root-Cause Analysis (RCA)", () => {
  it("correlates database symptoms with database connection loss candidate", () => {
    const mockIncident: IncidentRecord = {
      incidentId: "inc_db_101",
      projectId: "gym_proj",
      environment: "production",
      classification: "DATABASE_FAILURE",
      severity: "CRITICAL",
      status: "DETECTED",
      detectedAt: new Date().toISOString(),
      symptoms: ["Database connection pool timeout error P2024"],
      evidence: {},
      timeline: [],
    };

    const rca = RootCauseAnalyzer.analyze(mockIncident, ["Error: P2024 connection pool timeout"]);
    expect(rca.primaryRootCause.category).toBe("DATABASE_CONNECTION_LOSS");
    expect(rca.primaryRootCause.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
