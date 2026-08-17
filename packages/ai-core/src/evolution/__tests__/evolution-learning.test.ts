import { describe, it, expect } from "vitest";
import { EvolutionLearningEngine } from "../evolution-learning-engine.js";

describe("AEGIS Phase 35 — Evolution Learning Engine", () => {
  it("calibrates evolution prediction models with strictly ZERO safety policy mutations", () => {
    const report = EvolutionLearningEngine.extractLearning(30);
    expect(report.evolutionsEvaluatedCount).toBe(30);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.benefitPredictionAccuracy).toBeGreaterThanOrEqual(95);
  });
});
