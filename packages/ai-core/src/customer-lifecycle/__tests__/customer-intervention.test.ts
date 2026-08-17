import { describe, it, expect } from "vitest";
import { CustomerInterventionEngine } from "../customer-intervention-engine.js";

describe("AEGIS Phase 38 — Customer Intervention Engine", () => {
  it("recommends governed proactive intervention when churn risk or health degradation is observed", () => {
    const rec1 = CustomerInterventionEngine.evaluateIntervention("cust_1", "proj_gym", 88, 10);
    expect(rec1.recommendedAction).toBe("NO_ACTION");
    expect(rec1.requiresAuthorization).toBe(false);

    const rec2 = CustomerInterventionEngine.evaluateIntervention("cust_at_risk", "proj_gym", 30, 75);
    expect(rec2.recommendedAction).toBe("ESCALATE");
    expect(rec2.requiresAuthorization).toBe(true);
    expect(rec2.urgency).toBe("CRITICAL");
  });
});
