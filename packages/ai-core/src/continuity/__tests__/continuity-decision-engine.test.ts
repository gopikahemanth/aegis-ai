import { describe, it, expect } from "vitest";
import { EnterpriseContinuityDecisionEngine } from "../continuity-decision-engine.js";

describe("AEGIS Phase 28 — Enterprise Continuity Decision Engine", () => {
  it("requests authorization when an RTO breach occurs", () => {
    const rec = EnterpriseContinuityDecisionEngine.evaluateContinuity("proj_core", 75, true);
    expect(rec.action).toBe("REQUEST_AUTHORIZATION");
    expect(rec.requiresAuthorization).toBe(true);
  });
});
