import { describe, it, expect } from "vitest";
import { CustomerOnboardingEngine } from "../customer-onboarding-engine.js";

describe("AEGIS Phase 38 — Customer Onboarding Engine", () => {
  it("evaluates onboarding progress and time-to-first-value", () => {
    const report = CustomerOnboardingEngine.evaluateOnboarding("cust_1", "proj_gym", 5, 5, 2.0);
    expect(report.status).toBe("COMPLETED");
    expect(report.timeToFirstValueHours).toBe(2.0);
  });

  it("flags AT_RISK when onboarding time-to-first-value is delayed", () => {
    const report = CustomerOnboardingEngine.evaluateOnboarding("cust_2", "proj_gym", 2, 5, 72.0);
    expect(report.status).toBe("AT_RISK");
  });
});
