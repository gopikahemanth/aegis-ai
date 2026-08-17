import { describe, it, expect } from "vitest";
import { AdaptiveStrategyEngine } from "../adaptive-strategy-engine.js";

describe("AEGIS Phase 25 — Adaptive Strategy Engine", () => {
  it("recommends strategy adjustment when outcome achievement drops below 50%", () => {
    const evaluation = AdaptiveStrategyEngine.evaluateStrategy("org_alpha", 35, 75);
    expect(evaluation.recommendedAction).toBe("ADJUST_STRATEGY");
    expect(evaluation.requiresAuthorization).toBe(true);
    expect(evaluation.rationale).toContain("35%");
  });

  it("recommends replanning when engineering capacity utilization is over 90%", () => {
    const evaluation = AdaptiveStrategyEngine.evaluateStrategy("org_alpha", 85, 95);
    expect(evaluation.recommendedAction).toBe("REPLAN");
    expect(evaluation.requiresAuthorization).toBe(true);
  });
});
