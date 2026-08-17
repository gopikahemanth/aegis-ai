import { describe, it, expect } from "vitest";
import { CapacityAllocationEngine } from "../capacity-allocation-engine.js";

describe("AEGIS Phase 25 — Capacity Allocation Engine", () => {
  it("detects over-allocated engineering capacity across teams", () => {
    const result = CapacityAllocationEngine.evaluateTeamCapacity("t_core", 100, 120);
    expect(result.status).toBe("OVER_ALLOCATED");
    expect(result.utilizationPercentage).toBe(120);
  });

  it("classifies balanced workload correctly", () => {
    const result = CapacityAllocationEngine.evaluateTeamCapacity("t_core", 100, 70);
    expect(result.status).toBe("BALANCED");
    expect(result.utilizationPercentage).toBe(70);
  });
});
