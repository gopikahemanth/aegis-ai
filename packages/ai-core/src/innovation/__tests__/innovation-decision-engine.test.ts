import { describe, it, expect } from "vitest";
import { EnterpriseInnovationDecisionEngine } from "../innovation-decision-engine.js";

describe("AEGIS Phase 36 — Enterprise Innovation Decision Engine", () => {
  it("enforces simulation before authorization, authorization before experiment, experiment before full execution", () => {
    const dec1 = EnterpriseInnovationDecisionEngine.formulateDecision("opp_1", false, false, false, false);
    expect(dec1.recommendedAction).toBe("SIMULATE");

    const dec2 = EnterpriseInnovationDecisionEngine.formulateDecision("opp_1", true, false, false, false);
    expect(dec2.recommendedAction).toBe("REQUEST_AUTHORIZATION");

    const dec3 = EnterpriseInnovationDecisionEngine.formulateDecision("opp_1", true, true, false, false);
    expect(dec3.recommendedAction).toBe("EXPERIMENT");

    const dec4 = EnterpriseInnovationDecisionEngine.formulateDecision("opp_1", true, true, true, false);
    expect(dec4.recommendedAction).toBe("EXECUTE");

    const dec5 = EnterpriseInnovationDecisionEngine.formulateDecision("opp_1", true, true, true, true);
    expect(dec5.recommendedAction).toBe("LEARN");
  });
});
