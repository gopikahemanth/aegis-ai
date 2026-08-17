import { describe, it, expect } from "vitest";
import { ProductEvolutionAcceptance } from "../product-evolution-acceptance.js";

const allPassCriteria = {
  changeRequirementsSatisfied: true,
  newFeaturesVerified: true,
  affectedFeaturesVerified: true,
  databaseEvolutionPassed: true,
  backendEvolutionPassed: true,
  frontendEvolutionPassed: true,
  authVerified: true,
  uiConsistencyPassed: true,
  businessWorkflowsPassed: true,
  regressionTestsPassed: true,
  liveVerificationPassed: true,
  repairSuccessful: true,
  criticalDefectCount: 0,
};

describe("AEGIS Phase 56 — Product Evolution Acceptance", () => {
  it("accepts evolution when all 13 criteria pass with 0 defects", () => {
    const res = ProductEvolutionAcceptance.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(13);
    expect(res.passedCriteria).toBe(13);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("enforces NEW FEATURE WORKS + OLD FEATURE BROKEN = NOT ACCEPTED", () => {
    const res = ProductEvolutionAcceptance.evaluate({
      ...allPassCriteria,
      regressionTestsPassed: false, // Old feature broken
      criticalDefectCount: 1,
    });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name.includes("Regression"))).toBe(true);
  });
});
