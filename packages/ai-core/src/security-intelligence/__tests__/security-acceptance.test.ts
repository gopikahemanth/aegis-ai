import { describe, it, expect } from "vitest";
import { SecurityAcceptanceEngine } from "../security-acceptance-engine.js";

const allPassCriteria = {
  attackSurfaceAnalyzed: true,
  authenticationVerified: true,
  authorizationVerified: true,
  apiSecurityVerified: true,
  databaseSecurityVerified: true,
  inputValidationVerified: true,
  secretsScanPassed: true,
  dependencySecurityVerified: true,
  webSecurityVerified: true,
  privacyVerified: true,
  securityTestsPassed: true,
  repairsVerified: true,
  productionSecurityVerified: true,
  criticalVulnerabilitiesCount: 0,
};

describe("AEGIS Phase 58 — Security Acceptance Engine", () => {
  it("accepts product when all 14 security criteria pass with 0 critical findings", () => {
    const res = SecurityAcceptanceEngine.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(14);
    expect(res.passedCriteria).toBe(14);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("strictly denies acceptance when critical security vulnerabilities remain (NO BYPASS)", () => {
    const res = SecurityAcceptanceEngine.evaluate({
      ...allPassCriteria,
      secretsScanPassed: false, // Critical secret leaked
      criticalVulnerabilitiesCount: 1,
    });

    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.length).toBeGreaterThan(0);
    expect(res.summary).toContain("SECURITY BLOCKED");
  });
});
