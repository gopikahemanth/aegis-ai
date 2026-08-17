import { describe, it, expect, beforeEach } from "vitest";
import { ResilienceRiskEngine } from "../enterprise-risk-engine.js";

describe("AEGIS Phase 27 — Enterprise Risk Engine", () => {
  beforeEach(() => {
    ResilienceRiskEngine.reset();
  });

  it("registers and classifies structured risk records with explicit evidence states", () => {
    const risk = ResilienceRiskEngine.registerRisk({
      organizationId: "org_alpha",
      projectId: "proj_api",
      category: "DATABASE",
      severity: "MEDIUM",
      probabilityScore: 40,
      impactScore: 75,
      classification: "PREDICTED",
      affectedProjects: ["proj_api"],
      mitigationRecommendation: "Deploy active-active database replica",
    });

    expect(risk.riskId).toBeDefined();
    expect(risk.classification).toBe("PREDICTED");
    expect(ResilienceRiskEngine.getRisks("org_alpha").length).toBe(1);
  });
});

