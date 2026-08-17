import { describe, it, expect } from "vitest";
import { StrategicDecisionEngine } from "../strategic-decision-engine.js";

describe("AEGIS Phase 23 — Strategic Decision Engine", () => {
  it("enforces that strategic recommendations require human authorization", () => {
    const decision = StrategicDecisionEngine.evaluateInitiative("org_acme", "GraphQL API Migration", ["proj_1"]);
    expect(decision.type).toBe("RECOMMEND_INITIATIVE");
    expect(decision.requiresHumanAuthorization).toBe(true);
    expect(decision.confidence).toBeGreaterThan(0.9);
  });
});
