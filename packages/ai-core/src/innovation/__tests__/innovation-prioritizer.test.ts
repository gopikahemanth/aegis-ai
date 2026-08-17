import { describe, it, expect } from "vitest";
import { InnovationPrioritizer } from "../innovation-prioritizer.js";

describe("AEGIS Phase 36 — Innovation Prioritizer", () => {
  it("deterministically ranks opportunities based on ROI, user impact, and risk", () => {
    const opp1 = {
      opportunityId: "opp_high",
      title: "Real-Time Attendance Analytics",
      expectedRoi: 6.0,
      expectedUsers: 500,
      confidenceScore: 0.95,
      riskLevel: "LOW" as const,
      projectId: "p1",
      organizationId: "o1",
      teamId: "t1",
      sourceSignalId: "s1",
      sourceEvidenceSummary: "ev1",
      affectedProjects: [],
      affectedTeams: [],
      expectedValueINR: 120000,
      estimatedCostINR: 20000,
      authorizationRequired: true,
      status: "DISCOVERED" as const,
      createdAt: "",
      updatedAt: "",
    };

    const opp2 = {
      opportunityId: "opp_low",
      title: "Minor Color Tweak",
      expectedRoi: 1.1,
      expectedUsers: 10,
      confidenceScore: 0.8,
      riskLevel: "MODERATE" as const,
      projectId: "p1",
      organizationId: "o1",
      teamId: "t1",
      sourceSignalId: "s2",
      sourceEvidenceSummary: "ev2",
      affectedProjects: [],
      affectedTeams: [],
      expectedValueINR: 5000,
      estimatedCostINR: 4500,
      authorizationRequired: true,
      status: "DISCOVERED" as const,
      createdAt: "",
      updatedAt: "",
    };

    const ranked = InnovationPrioritizer.prioritizeOpportunities([opp2, opp1]);
    expect(ranked.length).toBe(2);
    expect(ranked[0].opportunityId).toBe("opp_high");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].priorityTier).toBe("CRITICAL");
    expect(ranked[0].governanceOverridePrevented).toBe(true);
  });
});
