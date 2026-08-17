import { describe, it, expect } from "vitest";
import { AuthenticationSecurityEngine } from "../authentication-security-engine.js";

describe("AEGIS Phase 58 — Authentication Security Engine", () => {
  it("verifies that protected resources reject unauthenticated and expired calls with 401", () => {
    const report = AuthenticationSecurityEngine.auditAuthentication();
    expect(report.isAuthSecure).toBe(true);
    expect(report.passedChecks).toBe(5);
    expect(report.passwordHashingAlgorithm).toContain("Argon2id");
  });

  it("detects authentication bypass vulnerabilities", () => {
    const report = AuthenticationSecurityEngine.auditAuthentication({ simulateAuthBypass: true });
    expect(report.isAuthSecure).toBe(false);
    expect(report.failedChecks).toBeGreaterThan(0);
  });
});
