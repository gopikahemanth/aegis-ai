import { describe, it, expect } from "vitest";
import { ActionEligibilityEngine } from "../action-eligibility-engine.js";

describe("AEGIS Phase 43 — Action Eligibility Engine", () => {
  it("enforces HIGH CONFIDENCE != AUTOMATIC AUTHORIZATION and guards multi-project production changes", () => {
    const prodMulti = ActionEligibilityEngine.evaluateEligibility("act_1", "production", 6, 0.99, true, true);
    expect(prodMulti.status).toBe("REQUIRES_MULTI_ROLE_REVIEW");

    const blocked = ActionEligibilityEngine.evaluateEligibility("act_2", "production", 2, 0.99, true, false);
    expect(blocked.status).toBe("BLOCKED");
    expect(blocked.isEligible).toBe(false);

    const devSafe = ActionEligibilityEngine.evaluateEligibility("act_3", "development", 1, 0.95, true, true);
    expect(devSafe.status).toBe("AUTO_SAFE");
  });
});
