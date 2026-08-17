import { describe, it, expect } from "vitest";
import { ExperimentDesignEngine } from "../experiment-design-engine.js";

describe("AEGIS Phase 40 — Experiment Design Engine", () => {
  it("creates structured and reproducible controlled experiment plans", () => {
    const plan = ExperimentDesignEngine.designExperiment(
      "hyp_123",
      "Zero-Copy In-Memory Event Streaming Trial",
      "Standard Event Routing",
      "Zero-Copy Streaming Engine",
      ["bufferSize", "batchIntervalMs"],
      45,
      15
    );

    expect(plan.experimentId).toBeDefined();
    expect(plan.controlGroup).toBe("Standard Event Routing");
    expect(plan.candidateGroup).toBe("Zero-Copy Streaming Engine");
    expect(plan.trafficPercentage).toBe(15);
    expect(plan.rollbackPlan.length).toBeGreaterThan(0);
  });
});
