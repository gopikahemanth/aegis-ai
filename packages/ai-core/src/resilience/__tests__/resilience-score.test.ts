import { describe, it, expect } from "vitest";
import { ResilienceScoreEngine } from "../resilience-score-engine.js";

describe("AEGIS Phase 27 — Resilience Score Engine", () => {
  it("calculates multidimensional evidence-backed resilience scores", () => {
    const report = ResilienceScoreEngine.computeResilience("proj_core", 99, 95, 100, 90);
    expect(report.overallScore).toBeGreaterThanOrEqual(95);
    expect(report.status).toBe("RESILIENT");
    expect(report.availabilityScore).toBe(99);
  });
});
