import { describe, it, expect } from "vitest";
import { IncidentRemediationEngine } from "../incident-remediation-engine.js";
import type { IncidentRecord } from "../../operations/incident-engine.js";

describe("AEGIS Phase 16 — Incident to Code Remediation Pipeline", () => {
  it("formulates governed remediation proposal with RCA and authorization requirements", () => {
    const mockIncident: IncidentRecord = {
      incidentId: "inc_101",
      projectId: "gym_proj",
      environment: "production",
      classification: "DATABASE_FAILURE",
      severity: "CRITICAL",
      status: "DETECTED",
      detectedAt: new Date().toISOString(),
      symptoms: ["Database connection pool timeout P2024"],
      evidence: {},
      timeline: [],
    };

    const proposal = IncidentRemediationEngine.formulateProposal(mockIncident, [
      "Error: P2024 connection pool timeout",
    ]);

    expect(proposal.requiresAuthorization).toBe(true);
    expect(proposal.actionType).toBe("ROLLBACK");
    expect(proposal.rca.primaryRootCause.confidence).toBeGreaterThan(0.9);
  });
});
