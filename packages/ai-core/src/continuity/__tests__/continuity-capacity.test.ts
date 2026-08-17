import { describe, it, expect } from "vitest";
import { ContinuityCapacityPlanner } from "../continuity-capacity-planner.js";

describe("AEGIS Phase 28 — Continuity Capacity Planner", () => {
  it("models worker capacity headroom under 40% loss conditions", () => {
    const plan = ContinuityCapacityPlanner.planCapacity("WORKER_NODES", 20, 40, 10);
    expect(plan.availableCapacityUnderFailure).toBe(12);
    expect(plan.status).toBe("NORMAL");
  });
});
