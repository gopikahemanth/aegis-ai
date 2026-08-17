import { describe, it, expect } from "vitest";
import { ApiSecurityEngine } from "../api-security-engine.js";

describe("AEGIS Phase 58 — API Security Engine", () => {
  it("verifies rate limiting, error masking, and disallows sensitive field leakage", () => {
    const report = ApiSecurityEngine.auditApiSecurity();
    expect(report.isApiSecure).toBe(true);
    expect(report.rateLimitingEnabled).toBe(true);
    expect(report.errorMaskingEnabled).toBe(true);
  });

  it("detects sensitive credential leakage in API payloads", () => {
    const report = ApiSecurityEngine.auditApiSecurity({ simulateSensitiveFieldLeak: true });
    expect(report.isApiSecure).toBe(false);
    expect(report.highCount).toBeGreaterThan(0);
  });
});
