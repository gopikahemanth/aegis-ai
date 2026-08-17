import { describe, it, expect } from "vitest";
import { RedundancyOptimizationEngine } from "../redundancy-optimization-engine.js";

describe("AEGIS Phase 28 — Redundancy Optimization Engine", () => {
  it("detects single points of failure on mission-critical components", () => {
    const assessment = RedundancyOptimizationEngine.evaluateRedundancy("Primary DB", 1, true);
    expect(assessment.status).toBe("SINGLE_POINT_OF_FAILURE");
    expect(assessment.recommendedReplicas).toBe(2);
  });
});
