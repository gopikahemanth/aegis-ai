import { describe, it, expect } from "vitest";
import { ExecutiveDecisionEngine } from "../executive-decision-engine.js";

describe("AEGIS Phase 31 — Executive Decision Engine", () => {
  it("enforces authorization requirement on critical executive decisions", () => {
    const rec = ExecutiveDecisionEngine.recommendAction(
      "proj_core",
      "REQUEST_AUTHORIZATION",
      "Major database topology migration requires executive sign-off.",
      ["ev_1", "ev_2"]
    );

    expect(rec.action).toBe("REQUEST_AUTHORIZATION");
    expect(rec.authorizationRequired).toBe(true);
    expect(rec.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
