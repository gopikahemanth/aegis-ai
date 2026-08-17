import { describe, it, expect } from "vitest";
import { EvolutionPlanner } from "../evolution-planner.js";

describe("AEGIS Phase 35 — Evolution Planner", () => {
  it("compiles approved opportunities into 6-phase execution plans", () => {
    const plan = EvolutionPlanner.compilePlan("opp_1", "sim_1", "auth_1");
    expect(plan.phases.length).toBe(6);
    expect(plan.phases[0].name).toContain("Preparation");
    expect(plan.phases[2].name).toContain("Canary");
    expect(plan.rollbackSteps.length).toBeGreaterThan(0);
    expect(plan.verificationSteps.length).toBeGreaterThan(0);
  });
});
