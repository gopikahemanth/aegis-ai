import { describe, it, expect, beforeEach } from "vitest";
import { ClosedLoopLearningEngine } from "../closed-loop-learning-engine.js";

describe("AEGIS Phase 43 — Closed-Loop Learning Engine", () => {
  beforeEach(() => {
    ClosedLoopLearningEngine.reset();
  });

  it("calibrates model heuristics without safety policy mutation or authorization bypass", () => {
    const update = ClosedLoopLearningEngine.calibrateModel("Engineering", true);
    expect(update.newConfidenceMultiplier).toBeGreaterThan(1.0);
    expect(update.safetyPoliciesMutated).toBe(0);
    expect(update.authorizationBypassesAttempted).toBe(0);

    const downUpdate = ClosedLoopLearningEngine.calibrateModel("Engineering", false);
    expect(downUpdate.newConfidenceMultiplier).toBeLessThan(update.newConfidenceMultiplier);
  });
});
