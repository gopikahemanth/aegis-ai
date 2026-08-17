import { describe, it, expect } from "vitest";
import { DecisionQualityEngine } from "../decision-quality-engine.js";

describe("AEGIS Phase 31 — Decision Quality Engine", () => {
  it("evaluates multidimensional decision quality enforcing GOOD OUTCOME != GOOD DECISION", () => {
    const evaluation = DecisionQualityEngine.evaluateDecision({
      decisionId: "dec_1",
      projectId: "proj_core",
      predictionAccuracy: 95,
      outcomeAchievement: 90,
      riskEstimationAccuracy: 92,
      costEstimationAccuracy: 88,
      reliabilityImpact: 95,
    });

    expect(evaluation.classification).toBe("EFFECTIVE");
    expect(evaluation.reasoningQualityScore).toBeGreaterThanOrEqual(90);
  });
});
