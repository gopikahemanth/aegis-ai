import { describe, it, expect } from "vitest";
import { DomainManagementEngine } from "../domain-management-engine.js";

describe("AEGIS Phase 54 — Domain Management Engine", () => {
  it("verifies DNS A & CNAME records for supplied production domain", () => {
    const res = DomainManagementEngine.verifyDomain("aegisgym.com");
    expect(res.isDomainVerified).toBe(true);
    expect(res.state).toBe("DOMAIN_VERIFIED");
    expect(res.dnsRecords).toHaveLength(3);
    expect(res.redirectWwwToApex).toBe(true);
  });

  it("returns DOMAIN_CONFIGURATION_REQUIRED if no domain is provided", () => {
    const res = DomainManagementEngine.verifyDomain(undefined);
    expect(res.isDomainVerified).toBe(false);
    expect(res.state).toBe("DOMAIN_CONFIGURATION_REQUIRED");
  });

  it("detects DNS misconfiguration failure", () => {
    const res = DomainManagementEngine.verifyDomain("aegisgym.com", { simulateDnsFailure: true });
    expect(res.isDomainVerified).toBe(false);
    expect(res.state).toBe("DOMAIN_MISCONFIGURED");
  });
});
