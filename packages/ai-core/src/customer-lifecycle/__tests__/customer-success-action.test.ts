import { describe, it, expect } from "vitest";
import { CustomerSuccessActionPlanner } from "../customer-success-action-planner.js";

describe("AEGIS Phase 38 — Customer Success Action Planner", () => {
  it("compiles authorized customer success action plans with verification criteria and rollback steps", () => {
    const plan = CustomerSuccessActionPlanner.compilePlan(
      "cust_1",
      "proj_gym",
      "Proactive Onboarding Assistance & Analytics Walkthrough",
      "auth_cs_123"
    );

    expect(plan.planId).toBeDefined();
    expect(plan.actionSteps.length).toBeGreaterThan(0);
    expect(plan.rollbackSteps.length).toBeGreaterThan(0);
    expect(plan.verificationCriteria.length).toBeGreaterThan(0);
  });
});
