import { describe, it, expect } from "vitest";
import { OpportunityDiscoveryEngine } from "../opportunity-discovery-engine.js";

describe("AEGIS Phase 60 — Opportunity Discovery Engine", () => {
  it("discovers low-risk conversion and UX growth opportunities", () => {
    const report = OpportunityDiscoveryEngine.discoverOpportunities();
    expect(report.opportunitiesCount).toBeGreaterThanOrEqual(2);
    expect(report.opportunities.some((o) => o.category === "UX_OPTIMIZATION")).toBe(true);
  });
});
