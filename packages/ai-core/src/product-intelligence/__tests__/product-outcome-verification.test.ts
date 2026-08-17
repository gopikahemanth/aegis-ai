import { describe, it, expect } from "vitest";
import { ProductOutcomeVerificationEngine } from "../product-outcome-verification.js";

describe("AEGIS Phase 37 — Product Outcome Verification Engine", () => {
  it("verifies product changes across Technical, Security, Product, Operational, and Business dimensions", () => {
    const report = ProductOutcomeVerificationEngine.verifyOutcome({
      opportunityId: "opp_1",
      technicalBuildPassed: true,
      securityChecksPassed: true,
      productFeaturesVerified: true,
      operationalLatencyHealthy: true,
      businessKpiPreserved: true,
    });

    expect(report.status).toBe("SUCCESS");
    expect(report.technicalVerified).toBe(true);
    expect(report.securityVerified).toBe(true);
    expect(report.productVerified).toBe(true);
    expect(report.operationalVerified).toBe(true);
    expect(report.businessVerified).toBe(true);
    expect(report.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
