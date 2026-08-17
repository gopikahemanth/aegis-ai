import { describe, it, expect, beforeEach } from "vitest";
import { InnovationRolloutEngine } from "../innovation-rollout-engine.js";

describe("AEGIS Phase 40 — Innovation Rollout Engine", () => {
  beforeEach(() => {
    InnovationRolloutEngine.reset();
  });

  it("advances innovation through phased rollout stages", () => {
    const rollout = InnovationRolloutEngine.initializeRollout("exp_123");
    expect(rollout.currentStage).toBe("PREVIEW");
    expect(rollout.trafficPercentage).toBe(0);

    const canary = InnovationRolloutEngine.advanceStage(rollout.rolloutId, "CANARY");
    expect(canary.currentStage).toBe("CANARY");
    expect(canary.trafficPercentage).toBe(15);

    const full = InnovationRolloutEngine.advanceStage(rollout.rolloutId, "FULL");
    expect(full.currentStage).toBe("FULL");
    expect(full.trafficPercentage).toBe(100);
  });
});
