import { describe, it, expect } from "vitest";
import { CustomerDecisionEngine } from "../customer-decision-engine.js";

describe("AEGIS Phase 38 — Customer Decision Engine", () => {
  it("enforces simulation before authorization, authorization before intervention, and intervention before learning", () => {
    const d1 = CustomerDecisionEngine.formulateDecision("cust_1", false, false, false, false);
    expect(d1.recommendedAction).toBe("SIMULATE");

    const d2 = CustomerDecisionEngine.formulateDecision("cust_1", true, false, false, false);
    expect(d2.recommendedAction).toBe("REQUEST_AUTHORIZATION");

    const d3 = CustomerDecisionEngine.formulateDecision("cust_1", true, true, false, false);
    expect(d3.recommendedAction).toBe("INTERVENE");

    const d4 = CustomerDecisionEngine.formulateDecision("cust_1", true, true, true, false);
    expect(d4.recommendedAction).toBe("INVESTIGATE");

    const d5 = CustomerDecisionEngine.formulateDecision("cust_1", true, true, true, true);
    expect(d5.recommendedAction).toBe("LEARN");
  });
});
