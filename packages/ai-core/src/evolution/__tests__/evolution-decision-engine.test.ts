import { describe, it, expect } from "vitest";
import { EnterpriseEvolutionDecisionEngine } from "../evolution-decision-engine.js";

describe("AEGIS Phase 35 — Enterprise Evolution Decision Engine", () => {
  it("enforces simulation before authorization and authorization before execution", () => {
    const dec1 = EnterpriseEvolutionDecisionEngine.formulateDecision("opp_1", false, false, false);
    expect(dec1.recommendedAction).toBe("SIMULATE");

    const dec2 = EnterpriseEvolutionDecisionEngine.formulateDecision("opp_1", true, false, false);
    expect(dec2.recommendedAction).toBe("REQUEST_AUTHORIZATION");

    const dec3 = EnterpriseEvolutionDecisionEngine.formulateDecision("opp_1", true, true, false);
    expect(dec3.recommendedAction).toBe("EXECUTE");

    const dec4 = EnterpriseEvolutionDecisionEngine.formulateDecision("opp_1", true, true, true);
    expect(dec4.recommendedAction).toBe("LEARN");
  });
});
