import { describe, it, expect } from "vitest";
import { InnovationExecutionEngine } from "../innovation-execution-engine.js";
import { ProductEvolutionPlanner } from "../product-evolution-planner.js";

describe("AEGIS Phase 36 — Innovation Execution Engine", () => {
  it("orchestrates execution through Phase 33 execution infrastructure", async () => {
    const plan = ProductEvolutionPlanner.compilePlan("opp_1", ["proj_gym"], "NOW");
    const result = await InnovationExecutionEngine.executeInnovation(plan, "auth_123");

    expect(result.status).toBe("COMPLETED");
    expect(result.milestonesExecutedCount).toBe(3);
    expect(result.executionId).toBeDefined();
  });
});
