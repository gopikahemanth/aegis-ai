import { describe, it, expect } from "vitest";
import { RemediationPolicyEngine } from "../remediation-policy.js";
import type { IncidentRecord } from "../incident-engine.js";

describe("AEGIS Phase 15 — Governed Remediation Policies", () => {
  it("enforces human authorization requirement for critical rollback remediation", () => {
    const criticalIncident: IncidentRecord = {
      incidentId: "inc_crit_101",
      projectId: "gym_proj",
      environment: "production",
      classification: "APPLICATION_FAILURE",
      severity: "CRITICAL",
      status: "DETECTED",
      detectedAt: new Date().toISOString(),
      symptoms: ["Process crashed with segmentation fault"],
      evidence: {},
      timeline: [],
    };

    const plan = RemediationPolicyEngine.evaluatePolicy(criticalIncident);
    expect(plan.policy).toBe("REQUIRES_AUTHORIZATION");
    expect(plan.suggestedAction).toBe("ROLLBACK_DEPLOYMENT");
    expect(plan.requiresAuthorization).toBe(true);
  });
});
