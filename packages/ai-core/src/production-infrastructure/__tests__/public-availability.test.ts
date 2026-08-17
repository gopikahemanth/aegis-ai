import { describe, it, expect } from "vitest";
import { PublicAvailabilityEngine } from "../public-availability-engine.js";

describe("AEGIS Phase 54 — Public Availability Engine", () => {
  it("enforces PROCESS_RUNNING ≠ PUBLICLY_REACHABLE for local only mode", () => {
    const res = PublicAvailabilityEngine.verifyPublicAvailability("aegisgym.com", { isLocalOnly: true });
    expect(res.isPubliclyAvailable).toBe(false);
    expect(res.summary).toContain("LOCAL ONLY");
  });

  it("verifies public WAN reachability when domain and HTTPS endpoints respond", () => {
    const res = PublicAvailabilityEngine.verifyPublicAvailability("aegisgym.com");
    expect(res.isPubliclyAvailable).toBe(true);
    expect(res.dnsResolved).toBe(true);
    expect(res.httpsResponding).toBe(true);
    expect(res.failedEndpoints).toHaveLength(0);
  });

  it("detects edge failure when public endpoints fail", () => {
    const res = PublicAvailabilityEngine.verifyPublicAvailability("aegisgym.com", { simulatePublicFailure: true });
    expect(res.isPubliclyAvailable).toBe(false);
    expect(res.failedEndpoints.length).toBeGreaterThan(0);
  });
});
