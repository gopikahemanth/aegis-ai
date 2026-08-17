import { describe, it, expect } from "vitest";
import { SystemicOpportunityEngine } from "../systemic-opportunity-engine.js";

describe("AEGIS Phase 42 — Systemic Opportunity Engine", () => {
  it("discovers cross-project enterprise architectural opportunities", () => {
    const opp = SystemicOpportunityEngine.discoverSystemicOpportunity(
      "Standardize Zero-Copy Streaming Pipeline across Fleet",
      "ENTERPRISE",
      4200000,
      15,
      ["proj_1", "proj_2", "proj_3", "proj_4"],
      ["ev_trial_p40", "ev_perf_benchmark"]
    );

    expect(opp.opportunityId).toBeDefined();
    expect(opp.scope).toBe("ENTERPRISE");
    expect(opp.expectedAnnualValueINR).toBe(4200000);
    expect(opp.affectedProjects.length).toBe(4);
  });
});
