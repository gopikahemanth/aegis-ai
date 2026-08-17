import { describe, it, expect, beforeEach } from "vitest";
import { ProductOpportunityDiscoveryEngine } from "../product-opportunity-discovery.js";

describe("AEGIS Phase 37 — Product Opportunity Discovery Engine", () => {
  beforeEach(() => {
    ProductOpportunityDiscoveryEngine.reset();
  });

  it("discovers product opportunities and transitions lifecycle", () => {
    const opp = ProductOpportunityDiscoveryEngine.discoverOpportunity({
      projectId: "proj_gym",
      sourceInsightId: "insight_123",
      title: "Real-Time Attendance Hub",
      targetUserGroup: "Gym Members & Front Desk Staff",
      expectedRetentionGain: 14.2,
      expectedValueINR: 150000,
      costINR: 25000,
    });

    expect(opp.opportunityId).toBeDefined();
    expect(opp.status).toBe("DISCOVERED");
    expect(opp.expectedRoi).toBe(6.0);

    const qualified = ProductOpportunityDiscoveryEngine.transitionState(opp.opportunityId, "QUALIFIED");
    expect(qualified.status).toBe("QUALIFIED");
  });

  it("rejects opportunity creation if source insight provenance is absent", () => {
    expect(() =>
      ProductOpportunityDiscoveryEngine.discoverOpportunity({
        projectId: "proj_gym",
        sourceInsightId: "",
        title: "Unproven Feature",
        targetUserGroup: "All",
        expectedRetentionGain: 0,
        expectedValueINR: 0,
        costINR: 0,
      })
    ).toThrow();
  });
});
