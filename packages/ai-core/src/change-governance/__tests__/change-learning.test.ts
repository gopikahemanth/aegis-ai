import { describe, it, expect } from "vitest";
import { ChangeLearningEngine } from "../change-learning-engine.js";

describe("AEGIS Phase 34 — Change Learning Engine", () => {
  it("calibrates change prediction models with strictly ZERO safety policy mutations", () => {
    const report = ChangeLearningEngine.extractLearning(40);
    expect(report.changesEvaluatedCount).toBe(40);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.impactPredictionAccuracy).toBeGreaterThanOrEqual(95);
  });
});
