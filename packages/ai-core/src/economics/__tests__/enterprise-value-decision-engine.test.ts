import { describe, it, expect } from "vitest";
import { EnterpriseValueDecisionEngine } from "../enterprise-value-decision-engine.js";

describe("AEGIS Phase 26 — Enterprise Value Decision Engine", () => {
  it("recommends investment acceleration for high ROI and realization rates", () => {
    const rec = EnterpriseValueDecisionEngine.evaluateInvestment("proj_core", 90, 3.5);
    expect(rec.recommendedAction).toBe("ACCELERATE");
    expect(rec.requiresAuthorization).toBe(true);
    expect(rec.confidence).toBeGreaterThan(0.9);
  });
});
