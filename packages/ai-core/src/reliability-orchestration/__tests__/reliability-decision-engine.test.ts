import { describe, it, expect } from "vitest";
import { EnterpriseReliabilityDecisionEngine } from "../enterprise-reliability-decision-engine.js";

describe("AEGIS Phase 30 — Enterprise Reliability Decision Engine", () => {
  it("enforces explicit authorization for destructive failover during active incident", () => {
    const dec = EnterpriseReliabilityDecisionEngine.evaluateIntervention("proj_core", true, true);
    expect(dec.action).toBe("REQUEST_AUTHORIZATION");
    expect(dec.requiresAuthorization).toBe(true);
  });
});
