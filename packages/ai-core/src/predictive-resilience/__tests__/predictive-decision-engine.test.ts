import { describe, it, expect } from "vitest";
import { PredictiveResilienceDecisionEngine } from "../predictive-resilience-decision-engine.js";

describe("AEGIS Phase 29 — Predictive Resilience Decision Engine", () => {
  it("requests authorization on critical probability and degraded readiness", () => {
    const dec = PredictiveResilienceDecisionEngine.evaluateDecision("proj_core", 85, 60);
    expect(dec.action).toBe("REQUEST_AUTHORIZATION");
    expect(dec.requiresAuthorization).toBe(true);
  });
});
