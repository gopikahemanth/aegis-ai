import { describe, it, expect } from "vitest";
import { InnovationComparisonEngine } from "../innovation-comparison-engine.js";

describe("AEGIS Phase 40 — Innovation Comparison Engine", () => {
  it("compares control vs candidate telemetry and classifies statistical outcome", () => {
    const report = InnovationComparisonEngine.compare("exp_123", 42, 18, 0.0, 0.0);
    expect(report.latencyDeltaPct).toBeGreaterThanOrEqual(50);
    expect(report.classification).toBe("STRONGLY_POSITIVE");
    expect(report.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
