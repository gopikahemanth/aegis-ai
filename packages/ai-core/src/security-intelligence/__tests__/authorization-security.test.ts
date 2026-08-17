import { describe, it, expect } from "vitest";
import { AuthorizationSecurityEngine } from "../authorization-security-engine.js";

describe("AEGIS Phase 58 — Authorization Security Engine", () => {
  it("enforces RBAC boundaries and blocks privilege escalation (403 on admin routes)", () => {
    const report = AuthorizationSecurityEngine.auditAuthorization();
    expect(report.isAuthorizationEnforced).toBe(true);
    expect(report.passedChecks).toBe(5);
    expect(report.failedChecks).toBe(0);
  });

  it("detects unauthorized privilege escalation when user accesses admin endpoint", () => {
    const report = AuthorizationSecurityEngine.auditAuthorization({ simulatePrivilegeEscalation: true });
    expect(report.isAuthorizationEnforced).toBe(false);
    expect(report.checks.some((c) => c.violationType === "PRIVILEGE_ESCALATION")).toBe(true);
  });

  it("detects IDOR vulnerabilities when member queries other member's record", () => {
    const report = AuthorizationSecurityEngine.auditAuthorization({ simulateIdorVulnerability: true });
    expect(report.isAuthorizationEnforced).toBe(false);
    expect(report.checks.some((c) => c.violationType === "IDOR")).toBe(true);
  });
});
