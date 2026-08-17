import { describe, it, expect } from "vitest";
import { TLSCertificateEngine } from "../tls-certificate-engine.js";

describe("AEGIS Phase 54 — TLS Certificate Engine", () => {
  it("verifies HTTPS certificate validity, expiration, and HSTS headers", () => {
    const res = TLSCertificateEngine.verifyTls("aegisgym.com");
    expect(res.isTlsVerified).toBe(true);
    expect(res.state).toBe("TLS_VERIFIED");
    expect(res.httpsEndpointVerified).toBe(true);
    expect(res.hstsHeaderPresent).toBe(true);
    expect(res.certificateDetails?.daysRemaining).toBe(89);
  });

  it("handles local environments with NOT_APPLICABLE status", () => {
    const res = TLSCertificateEngine.verifyTls("localhost", { isLocal: true });
    expect(res.state).toBe("NOT_APPLICABLE");
    expect(res.isTlsVerified).toBe(true);
  });

  it("detects TLS verification failure when certificate is invalid", () => {
    const res = TLSCertificateEngine.verifyTls("aegisgym.com", { simulateTlsFailure: true });
    expect(res.isTlsVerified).toBe(false);
    expect(res.state).toBe("TLS_FAILED");
  });
});
