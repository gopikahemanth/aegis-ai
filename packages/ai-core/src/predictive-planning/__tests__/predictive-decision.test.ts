import { describe, it, expect } from "vitest";
import { PredictivePlanningDecisionEngine } from "../predictive-decision-engine.js";

describe("AEGIS Phase 32 — Predictive Planning Decision Engine", () => {
  it("enforces REQUEST_AUTHORIZATION when emerging risk probability exceeds 70%", () => {
    const decision = PredictivePlanningDecisionEngine.formulateDecision("proj_core", 85, false);
    expect(decision.type).toBe("REQUEST_AUTHORIZATION");
    expect(decision.authorizationRequired).toBe(true);
    expect(decision.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
