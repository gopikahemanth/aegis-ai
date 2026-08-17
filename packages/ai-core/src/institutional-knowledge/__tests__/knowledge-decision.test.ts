import { describe, it, expect } from "vitest";
import { KnowledgeDecisionEngine } from "../knowledge-decision-engine.js";

describe("AEGIS Phase 41 — Knowledge Decision Engine", () => {
  it("enforces KNOWLEDGE != DECISION != AUTHORIZATION != EXECUTION separation", () => {
    const rec = KnowledgeDecisionEngine.formulateAction(true, 0.95, false);
    expect(rec.recommendedAction).toBe("RECOMMEND");
    expect(rec.confidenceScore).toBe(0.95);

    const review = KnowledgeDecisionEngine.formulateAction(true, 0.95, true);
    expect(review.recommendedAction).toBe("REQUEST_REVIEW");
  });
});
