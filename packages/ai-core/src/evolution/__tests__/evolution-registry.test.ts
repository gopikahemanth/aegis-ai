import { describe, it, expect, beforeEach } from "vitest";
import { EvolutionOpportunityRegistry } from "../evolution-opportunity.js";

describe("AEGIS Phase 35 — Evolution Opportunity Registry", () => {
  beforeEach(() => {
    EvolutionOpportunityRegistry.reset();
  });

  it("registers improvement opportunities and tracks lifecycle state transitions", () => {
    const opp = EvolutionOpportunityRegistry.registerOpportunity({
      organizationId: "org_alpha",
      projectId: "proj_gym",
      teamId: "team_arch",
      environment: "production",
      type: "ARCHITECTURAL_IMPROVEMENT",
      title: "Decouple Gateway Core",
      sourceEvidence: "Coupling metrics score 65%",
      affectedSystems: ["GymGateway", "AuthModule"],
      expectedBenefit: "+30% Maintainability",
      estimatedCostINR: 25000,
      riskLevel: "LOW",
      confidenceScore: 0.95,
      dependencies: [],
    });

    expect(opp.opportunityId).toBeDefined();
    expect(opp.status).toBe("DISCOVERED");

    const sim = EvolutionOpportunityRegistry.transitionState(opp.opportunityId, "SIMULATED");
    expect(sim.status).toBe("SIMULATED");
  });

  it("throws when sourceEvidence is missing", () => {
    expect(() =>
      EvolutionOpportunityRegistry.registerOpportunity({
        organizationId: "org_alpha",
        projectId: "proj_gym",
        teamId: "team_arch",
        environment: "production",
        type: "ARCHITECTURAL_IMPROVEMENT",
        title: "Decouple Gateway Core",
        sourceEvidence: "",
        affectedSystems: [],
        expectedBenefit: "",
        estimatedCostINR: 0,
        riskLevel: "LOW",
        confidenceScore: 0.9,
        dependencies: [],
      })
    ).toThrow();
  });
});
