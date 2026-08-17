import { describe, it, expect } from "vitest";
import { ProductionRemediationPlanner } from "../production-remediation-planner.js";
import { RootCauseDiagnosis } from "../production-diagnosis-engine.js";

describe("AEGIS Phase 55 — Production Remediation Planner", () => {
  it("creates SAFE_AUTOMATION plan for standard service restart", () => {
    const diagnosis: RootCauseDiagnosis = {
      diagnosisId: "diag_1",
      incidentId: "inc_1",
      certainty: "CONFIRMED",
      confidenceScore: 0.95,
      rootCause: "Database pool exhausted",
      evidence: ["5xx errors"],
      affectedComponents: ["Database"],
      recommendedActionType: "RESTART_DATABASE_POOL",
      detail: "Database connection pool saturated",
      diagnosedAt: new Date().toISOString(),
    };

    const plan = ProductionRemediationPlanner.plan(diagnosis);
    expect(plan.isAutoExecutable).toBe(true);
    expect(plan.requiresHumanApproval).toBe(false);
    expect(plan.primaryAction.safetyClass).toBe("SAFE_AUTOMATION");
  });

  it("enforces REQUIRES_AUTHORIZATION for high-risk rollback actions", () => {
    const diagnosis: RootCauseDiagnosis = {
      diagnosisId: "diag_2",
      incidentId: "inc_2",
      certainty: "PROBABLE",
      confidenceScore: 0.85,
      rootCause: "Bad deployment schema migration",
      evidence: ["Fatal error"],
      affectedComponents: ["Backend"],
      recommendedActionType: "ROLLBACK_RELEASE",
      detail: "Application broken after new release",
      diagnosedAt: new Date().toISOString(),
    };

    const plan = ProductionRemediationPlanner.plan(diagnosis, false);
    expect(plan.isAutoExecutable).toBe(false);
    expect(plan.requiresHumanApproval).toBe(true);
    expect(plan.primaryAction.safetyClass).toBe("REQUIRES_AUTHORIZATION");
  });
});
