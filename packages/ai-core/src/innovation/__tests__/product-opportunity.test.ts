import { describe, it, expect, beforeEach } from "vitest";
import { ProductOpportunityEngine } from "../product-opportunity-engine.js";

describe("AEGIS Phase 36 — Product Opportunity Engine", () => {
  beforeEach(() => {
    ProductOpportunityEngine.reset();
  });

  it("creates evidence-anchored product opportunities and transitions state", () => {
    const opp = ProductOpportunityEngine.createOpportunity({
      projectId: "proj_gym",
      organizationId: "org_global",
      teamId: "team_prod",
      title: "Real-Time Attendance Analytics",
      sourceSignalId: "sig_demand_1",
      sourceEvidenceSummary: "12 customer requests in telemetry",
      affectedProjects: ["proj_gym"],
      affectedTeams: ["team_prod"],
      expectedUsers: 500,
      expectedValueINR: 120000,
      estimatedCostINR: 20000,
      riskLevel: "LOW",
      confidenceScore: 0.95,
      authorizationRequired: true,
    });

    expect(opp.opportunityId).toBeDefined();
    expect(opp.status).toBe("DISCOVERED");
    expect(opp.expectedRoi).toBe(6);

    const qualified = ProductOpportunityEngine.transitionState(opp.opportunityId, "QUALIFIED");
    expect(qualified.status).toBe("QUALIFIED");
  });

  it("rejects creation when signal provenance is missing", () => {
    expect(() =>
      ProductOpportunityEngine.createOpportunity({
        projectId: "proj_gym",
        organizationId: "org_global",
        teamId: "team_prod",
        title: "Unanchored Proposal",
        sourceSignalId: "",
        sourceEvidenceSummary: "",
        affectedProjects: [],
        affectedTeams: [],
        expectedUsers: 0,
        expectedValueINR: 0,
        estimatedCostINR: 0,
        riskLevel: "LOW",
        confidenceScore: 0.5,
        authorizationRequired: true,
      })
    ).toThrow();
  });
});
