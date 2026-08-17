import { describe, it, expect } from "vitest";
import { ResourceOptimizationEngine } from "../resource-optimization-engine.js";

describe("AEGIS Phase 16 — Cost & Resource Optimization", () => {
  it("suggests cache optimization when hit rate falls below threshold", () => {
    const report = ResourceOptimizationEngine.evaluateEfficiency("gym_proj", {
      cacheHitRate: 35,
    });

    expect(report.recommendations.some((r) => r.type === "OPTIMIZE_CACHE")).toBe(true);
    expect(report.recommendations[0].estimatedSavingsPercent).toBeGreaterThan(0);
  });
});
