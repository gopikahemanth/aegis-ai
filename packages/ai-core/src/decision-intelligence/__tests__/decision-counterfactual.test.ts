import { describe, it, expect } from "vitest";
import { DecisionCounterfactualEngine } from "../decision-counterfactual-engine.js";

describe("AEGIS Phase 31 — Decision Counterfactual Engine", () => {
  it("runs what-if decision simulations with strictly ZERO mutations", () => {
    const sim = DecisionCounterfactualEngine.simulateWhatIf(
      "Promote Postgres Replica Now",
      "Delay Replica Promotion by 30 min",
      45,
      120000,
      -30
    );

    expect(sim.classification).toBe("SIMULATED");
    expect(sim.mutationsAttempted).toBe(0);
    expect(sim.projectedCostDeltaINR).toBe(120000);
  });
});
