import { describe, it, expect } from "vitest";
import { KnowledgeReuseEngine } from "../knowledge-reuse-engine.js";

describe("AEGIS Phase 41 — Knowledge Reuse Engine", () => {
  it("calculates empirical reuse rate and engineering time savings", () => {
    const metrics = KnowledgeReuseEngine.calculateReuseMetrics("org_global", 50, 42, 38, 190);
    expect(metrics.reuseRatePct).toBe(84);
    expect(metrics.estimatedEngineeringHoursSaved).toBe(190);
    expect(metrics.effectivenessScore).toBeGreaterThanOrEqual(0.9);
  });
});
