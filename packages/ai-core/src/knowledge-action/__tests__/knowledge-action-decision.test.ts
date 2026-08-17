import { describe, it, expect } from "vitest";
import { KnowledgeActionDecisionEngine } from "../knowledge-action-decision-engine.js";

describe("AEGIS Phase 43 — Knowledge Action Decision Engine", () => {
  it("enforces INTELLIGENCE != DECISION != AUTHORIZATION != EXECUTION and generates governed decision proposals", () => {
    const authProposal = KnowledgeActionDecisionEngine.evaluateDecision("act_1", true, false, 0.95, "LOW");
    expect(authProposal.recommendedDecision).toBe("REQUEST_AUTHORIZATION");

    const reviewProposal = KnowledgeActionDecisionEngine.evaluateDecision("act_2", true, false, 0.95, "CRITICAL");
    expect(reviewProposal.recommendedDecision).toBe("REQUEST_REVIEW");

    const revalProposal = KnowledgeActionDecisionEngine.evaluateDecision("act_3", true, true, 0.8, "LOW");
    expect(revalProposal.recommendedDecision).toBe("REVALIDATE");
  });
});
