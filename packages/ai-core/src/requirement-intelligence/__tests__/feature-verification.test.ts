import { describe, it, expect } from "vitest";
import { FeatureVerificationEngine } from "../feature-verification-engine.js";
import { FeatureContractEngine } from "../feature-contract-engine.js";

describe("AEGIS Phase 61 — Feature Verification Engine", () => {
  const contract = FeatureContractEngine.createContract({
    id: "rdm_req-061",
    requirementId: "REQ-061",
    title: "Authorized Member Data Bulk Export",
    quarter: "Q1",
    priority: "P1_HIGH",
    dependencies: [],
    status: "PLANNED",
    expectedImpact: "Saves 4 hours/week",
    estimatedComplexity: "LOW",
    authorizationStatus: "AWAITING_AUTHORIZATION",
  });

  it("verifies new feature across all 10 layers with zero regressions", () => {
    const report = FeatureVerificationEngine.verifyFeature(contract);
    expect(report.isFullyVerified).toBe(true);
    expect(report.hasExistingWorkflowRegression).toBe(false);
    expect(report.checks.length).toBe(10);
  });

  it("detects regressions on existing product workflows and blocks verification", () => {
    const report = FeatureVerificationEngine.verifyFeature(contract, {
      simulateWorkflowRegression: true,
    });
    expect(report.isFullyVerified).toBe(false);
    expect(report.hasExistingWorkflowRegression).toBe(true);
  });
});
