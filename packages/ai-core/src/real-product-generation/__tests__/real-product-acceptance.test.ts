import { describe, it, expect } from "vitest";
import { RealProductAcceptanceEngine } from "../real-product-acceptance.js";

describe("AEGIS Phase 52 — Real Product Acceptance Engine", () => {
  it("accepts a product only when all 12 critical criteria pass", () => {
    const result = RealProductAcceptanceEngine.evaluate({
      requirementsCoverage: 100,
      criticalFeaturesPassed: true,
      criticalWorkflowsPassed: true,
      databaseVerified: true,
      backendVerified: true,
      frontendVerified: true,
      authenticationVerified: true,
      authorizationVerified: true,
      uiUxPassed: true,
      responsivePassed: true,
      accessibilityPassed: true,
      criticalDefectCount: 0,
    });
    expect(result.isAccepted).toBe(true);
    expect(result.overallScore).toBe(100);
    expect(result.criticalDefectCount).toBe(0);
  });

  it("blocks acceptance when 1 critical defect exists — enforcing HIGH SCORE != ACCEPTANCE", () => {
    const result = RealProductAcceptanceEngine.evaluate({
      requirementsCoverage: 100,
      criticalFeaturesPassed: true,
      criticalWorkflowsPassed: true,
      databaseVerified: true,
      backendVerified: true,
      frontendVerified: true,
      authenticationVerified: true,
      authorizationVerified: true,
      uiUxPassed: true,
      responsivePassed: true,
      accessibilityPassed: true,
      criticalDefectCount: 1,
    });
    expect(result.isAccepted).toBe(false);
    expect(result.blockedBy.length).toBeGreaterThan(0);
    expect(result.blockedBy.some((b) => b.name === "Critical Defects = 0")).toBe(true);
  });
});
