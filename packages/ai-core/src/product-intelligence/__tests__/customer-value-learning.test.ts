import { describe, it, expect } from "vitest";
import { CustomerValueLearningEngine } from "../customer-value-learning.js";

describe("AEGIS Phase 37 — Customer Value Learning Engine", () => {
  it("calibrates adoption and value forecasting models with strictly ZERO policy mutations", () => {
    const report = CustomerValueLearningEngine.extractLearning(18);
    expect(report.featuresEvaluatedCount).toBe(18);
    expect(report.securityPolicyMutationsAttempted).toBe(0);
    expect(report.authorizationPolicyMutationsAttempted).toBe(0);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.adoptionForecastAccuracy).toBeGreaterThanOrEqual(90);
  });
});
