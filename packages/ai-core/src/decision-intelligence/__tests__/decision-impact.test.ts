import { describe, it, expect } from "vitest";
import { DecisionImpactEngine } from "../decision-impact-engine.js";

describe("AEGIS Phase 31 — Decision Impact Engine", () => {
  it("calculates downstream systemic impact when 3 or more projects are affected", () => {
    const impact = DecisionImpactEngine.calculateImpact(
      "dec_auth_rearch",
      ["proj_gym", "proj_billing", "proj_portal"],
      ["team_sre", "team_core"],
      "Authentication Gateway",
      50000
    );

    expect(impact.impactType).toBe("SYSTEMIC_IMPACT");
    expect(impact.reliabilityRiskDeltaPercentage).toBe(-15);
  });
});
