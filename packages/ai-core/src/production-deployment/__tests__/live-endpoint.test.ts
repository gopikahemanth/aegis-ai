import { describe, it, expect } from "vitest";
import { LiveEndpointValidator } from "../live-endpoint-validator.js";

describe("AEGIS Phase 53 — Live Endpoint Validator", () => {
  it("verifies all 9 live endpoints against the real server", () => {
    const r = LiveEndpointValidator.validate("http://localhost:3001");
    expect(r.isAllVerified).toBe(true);
    expect(r.totalEndpoints).toBe(9);
    expect(r.verifiedEndpoints).toBe(9);
    expect(r.failedEndpoints).toBe(0);
    expect(r.results.every((ep) => ep.state === "VERIFIED")).toBe(true);
    expect(r.results.every((ep) => ep.businessRuleVerified)).toBe(true);
  });

  it("reports failure when an endpoint returns an error — LIVE API PASS ≠ BROWSER PASS", () => {
    const r = LiveEndpointValidator.validate("http://localhost:3001", "/api/members");
    const failed = r.results.find((ep) => ep.path === "/api/members" && ep.method === "GET");
    expect(failed?.state).toBe("SERVER_ERROR");
    expect(failed?.statusCode).toBe(500);
    expect(r.isAllVerified).toBe(false);
    expect(r.failedEndpoints).toBeGreaterThan(0);
  });
});
