import { describe, it, expect } from "vitest";
import { EnterpriseProductDecisionEngine } from "../product-decision-engine.js";

describe("AEGIS Phase 37 — Enterprise Product Decision Engine", () => {
  it("enforces simulation before authorization, authorization before experiment, experiment before full rollout", () => {
    const d1 = EnterpriseProductDecisionEngine.formulateDecision("opp_1", false, false, false, false);
    expect(d1.recommendedAction).toBe("SIMULATE");

    const d2 = EnterpriseProductDecisionEngine.formulateDecision("opp_1", true, false, false, false);
    expect(d2.recommendedAction).toBe("REQUEST_AUTHORIZATION");

    const d3 = EnterpriseProductDecisionEngine.formulateDecision("opp_1", true, true, false, false);
    expect(d3.recommendedAction).toBe("EXPERIMENT");

    const d4 = EnterpriseProductDecisionEngine.formulateDecision("opp_1", true, true, true, false);
    expect(d4.recommendedAction).toBe("EXECUTE");

    const d5 = EnterpriseProductDecisionEngine.formulateDecision("opp_1", true, true, true, true);
    expect(d5.recommendedAction).toBe("LEARN");
  });
});
