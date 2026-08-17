import { describe, it, expect } from "vitest";
import { LearningGovernanceDecisionEngine } from "../learning-governance-decision-engine.js";

describe("AEGIS Phase 44 — Learning Governance Decision Engine", () => {
  it("formulates governed decisions preserving authorization boundaries", () => {
    const ctrdDecision = LearningGovernanceDecisionEngine.evaluateDecision(true, false, 0.8);
    expect(ctrdDecision.recommendedDecision).toBe("INVESTIGATE");
    expect(ctrdDecision.requiresHumanReview).toBe(true);

    const normalDecision = LearningGovernanceDecisionEngine.evaluateDecision(false, false, 0.95);
    expect(normalDecision.recommendedDecision).toBe("RECOMMEND");
  });
});
