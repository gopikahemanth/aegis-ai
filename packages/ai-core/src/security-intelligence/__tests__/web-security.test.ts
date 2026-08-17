import { describe, it, expect } from "vitest";
import { WebSecurityEngine } from "../web-security-engine.js";

describe("AEGIS Phase 58 — Web Security Engine", () => {
  it("audits CSP, HSTS, X-Frame-Options, and confirms debug routes disabled", () => {
    const report = WebSecurityEngine.auditWebSecurity();
    expect(report.isWebLayerSecure).toBe(true);
    expect(report.debugEndpointsDisabled).toBe(true);
    expect(report.checks.length).toBeGreaterThanOrEqual(4);
  });

  it("detects exposed debug endpoints in production", () => {
    const report = WebSecurityEngine.auditWebSecurity({ simulateExposedDebugEndpoint: true });
    expect(report.isWebLayerSecure).toBe(false);
    expect(report.debugEndpointsDisabled).toBe(false);
  });
});
