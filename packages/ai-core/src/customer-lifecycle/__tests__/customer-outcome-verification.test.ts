import { describe, it, expect } from "vitest";
import { CustomerOutcomeVerificationEngine } from "../customer-outcome-verification.js";

describe("AEGIS Phase 38 — Customer Outcome Verification Engine", () => {
  it("verifies customer outcomes across Onboarding, Adoption, Product Value, Retention, and Business Value", () => {
    const report = CustomerOutcomeVerificationEngine.verifyOutcome({
      customerId: "cust_1",
      onboardingVerified: true,
      adoptionVerified: true,
      productValueVerified: true,
      retentionVerified: true,
      businessValueVerified: true,
    });

    expect(report.status).toBe("ACHIEVED");
    expect(report.onboardingVerified).toBe(true);
    expect(report.adoptionVerified).toBe(true);
    expect(report.productValueVerified).toBe(true);
    expect(report.retentionVerified).toBe(true);
    expect(report.businessValueVerified).toBe(true);
    expect(report.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
