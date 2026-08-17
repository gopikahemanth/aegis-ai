import { describe, it, expect, beforeEach } from "vitest";
import { CustomerLifecycleStateEngine } from "../customer-lifecycle-state.js";

describe("AEGIS Phase 38 — Customer Lifecycle State Engine", () => {
  beforeEach(() => {
    CustomerLifecycleStateEngine.reset();
  });

  it("registers customer profiles and transitions lifecycle stages", () => {
    const profile = CustomerLifecycleStateEngine.registerCustomer("cust_1", "proj_gym", "tenant_gym", "ONBOARDING");
    expect(profile.customerId).toBe("cust_1");
    expect(profile.stage).toBe("ONBOARDING");
    expect(profile.riskState).toBe("HEALTHY");

    const adopted = CustomerLifecycleStateEngine.transitionStage("cust_1", "ADOPTING", "HEALTHY");
    expect(adopted.stage).toBe("ADOPTING");
  });
});
