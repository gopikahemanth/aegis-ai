import { describe, it, expect } from "vitest";
import { CustomerLifecycleLearningEngine } from "../customer-lifecycle-learning.js";

describe("AEGIS Phase 38 — Customer Lifecycle Learning Engine", () => {
  it("calibrates health scoring and churn prediction accuracy with strictly ZERO policy mutations", () => {
    const report = CustomerLifecycleLearningEngine.extractLearning(45);
    expect(report.customersEvaluatedCount).toBe(45);
    expect(report.securityPolicyMutationsAttempted).toBe(0);
    expect(report.authorizationPolicyMutationsAttempted).toBe(0);
    expect(report.tenantIsolationMutationsAttempted).toBe(0);
    expect(report.privacyPolicyMutationsAttempted).toBe(0);
    expect(report.healthScoreAccuracyPct).toBeGreaterThanOrEqual(90);
  });
});
