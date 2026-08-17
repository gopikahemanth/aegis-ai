import { describe, it, expect } from "vitest";
import { ProductEvolutionPlanner } from "../product-evolution-planner.js";

describe("AEGIS Phase 36 — Product Evolution Planner", () => {
  it("compiles approved opportunities into multi-milestone evolution plans", () => {
    const plan = ProductEvolutionPlanner.compilePlan("opp_1", ["proj_gym"], "NOW");
    expect(plan.milestones.length).toBe(3);
    expect(plan.horizon).toBe("NOW");
    expect(plan.rollbackCheckpoints.length).toBeGreaterThan(0);
    expect(plan.businessOutcomeMetrics.length).toBeGreaterThan(0);
  });
});
