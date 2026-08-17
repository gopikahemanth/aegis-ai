import { describe, it, expect } from "vitest";
import { CustomerBehaviorEngine } from "../customer-behavior-engine.js";

describe("AEGIS Phase 37 — Customer Behavior Engine", () => {
  it("evaluates aggregate customer behavior and retention health", () => {
    const profile = CustomerBehaviorEngine.evaluateBehavior("proj_gym", 250, 94, 18, 0.95);
    expect(profile.healthState).toBe("IMPROVING");
    expect(profile.activeUsersCount).toBe(250);
  });

  it("marks profile as AT_RISK when retention degrades", () => {
    const profile = CustomerBehaviorEngine.evaluateBehavior("proj_gym", 100, 55, 4, 0.6);
    expect(profile.healthState).toBe("AT_RISK");
  });
});
