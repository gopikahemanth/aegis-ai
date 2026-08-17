import { describe, it, expect } from "vitest";
import { ActionAuthorizationEngine } from "../action-authorization-engine.js";

describe("AEGIS Phase 32 — Action Authorization Engine", () => {
  it("enforces that prediction confidence NEVER overrides authorization policy", () => {
    const unapproved = ActionAuthorizationEngine.evaluateAction("act_1", "proj_core", false, false);
    expect(unapproved.decision).toBe("REQUIRES_AUTHORIZATION");
    expect(unapproved.isPolicyCompliant).toBe(false);

    const approved = ActionAuthorizationEngine.evaluateAction("act_1", "proj_core", false, true);
    expect(approved.decision).toBe("ALLOW");
    expect(approved.isPolicyCompliant).toBe(true);
  });
});
