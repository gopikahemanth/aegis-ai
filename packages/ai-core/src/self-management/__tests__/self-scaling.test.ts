import { describe, it, expect } from "vitest";
import { SelfCapacityEngine } from "../self-capacity-engine.js";

describe("AEGIS Phase 20 — Self-Capacity & Autonomous Worker Scaling", () => {
  it("recommends adding worker when job queue depth exceeds capacity thresholds", () => {
    const capacity = SelfCapacityEngine.evaluateCapacity(2, 15);
    expect(capacity.status).toBe("HIGH_LOAD");
    expect(capacity.recommendation).toBe("ADD_WORKER");
  });

  it("reports HEALTHY status and MAINTAIN recommendation during nominal traffic", () => {
    const capacity = SelfCapacityEngine.evaluateCapacity(4, 2);
    expect(capacity.status).toBe("HEALTHY");
    expect(capacity.recommendation).toBe("MAINTAIN");
  });
});
