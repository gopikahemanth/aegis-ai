import { describe, it, expect } from "vitest";
import { RealBackendProvisioner } from "../real-backend-provisioner.js";

describe("AEGIS Phase 52 — Real Backend Provisioner", () => {
  it("verifies health endpoint, authentication, REST endpoints, and business rule enforcement", () => {
    const result = RealBackendProvisioner.verify();
    expect(result.isFullyVerified).toBe(true);
    expect(result.state).toBe("BUSINESS_RULES_VERIFIED");
    expect(result.healthCheckPassed).toBe(true);
    expect(result.authenticationVerified).toBe(true);
    expect(result.businessRulesEnforced).toBe(true);
    expect(result.errorHandlingVerified).toBe(true);
    expect(result.endpointsVerified.length).toBeGreaterThanOrEqual(4);
    expect(result.endpointsVerified.every((e) => e.statusCode === 200)).toBe(true);
  });

  it("reports failure when backend health check fails — enforcing BUILD PASS != PRODUCT ACCEPTANCE", () => {
    const result = RealBackendProvisioner.verify(undefined, true);
    expect(result.isFullyVerified).toBe(false);
    expect(result.state).toBe("FAILED");
    expect(result.healthCheckPassed).toBe(false);
  });
});
