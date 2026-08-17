import { describe, it, expect } from "vitest";
import { LearningScenarioSimulator } from "../learning-scenario-simulator.js";

describe("AEGIS Phase 44 — Learning Scenario Simulator", () => {
  it("executes zero-mutation counterfactual learning simulations", () => {
    const sim = LearningScenarioSimulator.simulate("Test Fleet Reuse", ["les_1", "les_2"]);

    expect(sim.sourceMutations).toBe(0);
    expect(sim.databaseMutations).toBe(0);
    expect(sim.deploymentMutations).toBe(0);
    expect(sim.policyMutations).toBe(0);
    expect(sim.authorizationMutations).toBe(0);
    expect(sim.projectedDecisionAccuracyLiftPct).toBe(22);
  });
});
