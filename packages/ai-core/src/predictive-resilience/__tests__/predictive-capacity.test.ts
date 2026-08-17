import { describe, it, expect } from "vitest";
import { PredictiveCapacityScaler } from "../predictive-capacity-scaler.js";

describe("AEGIS Phase 29 — Predictive Capacity Scaler", () => {
  it("triggers pre-scaling when failure probability exceeds 70%", () => {
    const scale = PredictiveCapacityScaler.evaluateScaling("WORKER_POOL", 10, 80);
    expect(scale.scaleAction).toBe("PRE_SCALE");
    expect(scale.recommendedCapacity).toBe(14);
  });
});
