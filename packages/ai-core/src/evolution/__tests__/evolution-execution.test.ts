import { describe, it, expect } from "vitest";
import { EvolutionExecutionEngine } from "../evolution-execution-engine.js";
import { EvolutionPlanner } from "../evolution-planner.js";

describe("AEGIS Phase 35 — Evolution Execution Engine", () => {
  it("orchestrates multi-phase execution through Phase 33 execution capabilities", async () => {
    const plan = EvolutionPlanner.compilePlan("opp_1", "sim_1", "auth_1");
    const result = await EvolutionExecutionEngine.executeEvolution(plan);

    expect(result.status).toBe("COMPLETED");
    expect(result.phasesExecutedCount).toBe(6);
    expect(result.executionId).toBeDefined();
  });
});
