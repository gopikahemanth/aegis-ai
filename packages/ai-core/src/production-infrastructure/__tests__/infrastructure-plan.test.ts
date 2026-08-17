import { describe, it, expect } from "vitest";
import { InfrastructurePlanEngine } from "../infrastructure-plan-engine.js";
import { HostingTargetEngine } from "../hosting-target-engine.js";

describe("AEGIS Phase 54 — Infrastructure Plan Engine", () => {
  it("creates a 7-step ordered infrastructure plan with dependencies", () => {
    const target = HostingTargetEngine.selectTarget("LOCAL");
    const plan = InfrastructurePlanEngine.createPlan("GymMaster Pro", target, { domain: "aegisgym.com" });

    expect(plan.steps).toHaveLength(7);
    expect(plan.domain).toBe("aegisgym.com");
    expect(plan.tlsEnabled).toBe(true);
    expect(plan.rollbackStrategy).toBe("PREVIOUS_INFRASTRUCTURE_STATE_RESTORE");
    expect(plan.healthCheckEndpoints.length).toBeGreaterThan(0);
    expect(plan.steps[0].phase).toBe("DATABASE");
    expect(plan.steps[1].phase).toBe("BACKEND");
  });
});
