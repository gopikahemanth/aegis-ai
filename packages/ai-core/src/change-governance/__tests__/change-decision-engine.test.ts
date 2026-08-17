import { describe, it, expect } from "vitest";
import { EnterpriseChangeDecisionEngine } from "../change-decision-engine.js";

describe("AEGIS Phase 34 — Enterprise Change Decision Engine", () => {
  it("enforces simulation before approval and approval before execution", () => {
    const dec1 = EnterpriseChangeDecisionEngine.formulateDecision("chg_1", false, false, false);
    expect(dec1.recommendedAction).toBe("SIMULATE");

    const dec2 = EnterpriseChangeDecisionEngine.formulateDecision("chg_1", true, false, false);
    expect(dec2.recommendedAction).toBe("REQUEST_APPROVAL");

    const dec3 = EnterpriseChangeDecisionEngine.formulateDecision("chg_1", true, true, false);
    expect(dec3.recommendedAction).toBe("EXECUTE");

    const dec4 = EnterpriseChangeDecisionEngine.formulateDecision("chg_1", true, true, true);
    expect(dec4.recommendedAction).toBe("LEARN");
  });
});
