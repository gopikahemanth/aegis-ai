import { describe, it, expect } from "vitest";
import { EnterpriseSynthesisDecisionEngine } from "../enterprise-synthesis-decision-engine.js";

describe("AEGIS Phase 42 — Enterprise Synthesis Decision Engine", () => {
  it("enforces SYNTHESIS != DECISION != AUTHORIZATION != EXECUTION separation", () => {
    const riskDecision = EnterpriseSynthesisDecisionEngine.evaluateDecision(true, false, 0.95);
    expect(riskDecision.recommendedAction).toBe("REQUEST_REVIEW");
    expect(riskDecision.riskLevel).toBe("HIGH");

    const simDecision = EnterpriseSynthesisDecisionEngine.evaluateDecision(false, true, 0.85);
    expect(simDecision.recommendedAction).toBe("SIMULATE");

    const recDecision = EnterpriseSynthesisDecisionEngine.evaluateDecision(false, false, 0.95);
    expect(recDecision.recommendedAction).toBe("RECOMMEND");
  });
});
