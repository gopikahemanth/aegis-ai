import { describe, it, expect } from "vitest";
import { ProductExecutionCoordinator } from "../product-execution-coordinator.js";
import { ProductEvolutionEngine } from "../product-evolution-engine.js";

describe("AEGIS Phase 37 — Product Execution Coordinator", () => {
  it("coordinates execution through Phase 33 autonomous execution infrastructure", async () => {
    const plan = ProductEvolutionEngine.compileEvolutionPlan("opp_1", ["proj_gym"], "NOW");
    const result = await ProductExecutionCoordinator.executeProductPlan(plan, "auth_123");

    expect(result.status).toBe("COMPLETED");
    expect(result.milestonesExecutedCount).toBe(3);
    expect(result.executionId).toBeDefined();
  });
});
