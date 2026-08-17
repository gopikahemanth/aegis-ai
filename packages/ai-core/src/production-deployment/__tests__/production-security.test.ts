import { describe, it, expect } from "vitest";
import { ProductionSecurityValidator } from "../production-security-validator.js";

describe("AEGIS Phase 53 — Production Security Validator", () => {
  it("verifies critical security checks and includes NOT_TESTED disclaimer", () => {
    const r = ProductionSecurityValidator.validate();
    expect(r.isProductionSafe).toBe(true);
    expect(r.overallState).toBe("PARTIALLY_VERIFIED");
    expect(r.checks.some((c) => c.state === "VERIFIED")).toBe(true);
    expect(r.checks.some((c) => c.state === "NOT_TESTED")).toBe(true);
    expect(r.disclaimer).toContain("penetration test");
  });

  it("fails and blocks deployment when a critical security check fails", () => {
    const r = ProductionSecurityValidator.validate("Authentication Required on Protected Routes");
    expect(r.isProductionSafe).toBe(false);
    expect(r.overallState).toBe("FAILED");
    expect(r.failedCriticalChecks).toContain("Authentication Required on Protected Routes");
  });
});
