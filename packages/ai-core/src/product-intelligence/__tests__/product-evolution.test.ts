import { describe, it, expect } from "vitest";
import { ProductEvolutionEngine } from "../product-evolution-engine.js";

describe("AEGIS Phase 37 — Product Evolution Engine", () => {
  it("compiles product opportunities into multi-milestone evolution plans across horizons", () => {
    const plan = ProductEvolutionEngine.compileEvolutionPlan("opp_1", ["proj_gym"], "NOW");
    expect(plan.milestones.length).toBe(3);
    expect(plan.horizon).toBe("NOW");
    expect(plan.rollbackCheckpoints.length).toBeGreaterThan(0);
    expect(plan.businessKpiMetrics.length).toBeGreaterThan(0);
  });
});
