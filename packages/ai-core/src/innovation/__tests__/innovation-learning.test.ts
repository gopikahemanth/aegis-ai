import { describe, it, expect } from "vitest";
import { InnovationLearningEngine } from "../innovation-learning-engine.js";

describe("AEGIS Phase 36 — Innovation Learning Engine", () => {
  it("calibrates benefit prediction models with strictly ZERO policy mutations", () => {
    const report = InnovationLearningEngine.extractLearning(25);
    expect(report.innovationsEvaluatedCount).toBe(25);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.authorizationPolicyMutationsAttempted).toBe(0);
    expect(report.securityPolicyMutationsAttempted).toBe(0);
    expect(report.benefitPredictionAccuracy).toBeGreaterThanOrEqual(95);
  });
});
