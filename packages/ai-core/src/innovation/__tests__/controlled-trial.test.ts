import { describe, it, expect, beforeEach } from "vitest";
import { ControlledTrialEngine } from "../controlled-trial-engine.js";

describe("AEGIS Phase 40 — Controlled Trial Engine", () => {
  beforeEach(() => {
    ControlledTrialEngine.reset();
  });

  it("coordinates controlled trial lifecycles and stage transitions", () => {
    const trial = ControlledTrialEngine.initializeTrial("exp_123", "proj_gym", "CANARY", 15);
    expect(trial.stage).toBe("DESIGNED");
    expect(trial.mode).toBe("CANARY");

    const running = ControlledTrialEngine.transitionStage(trial.trialId, "RUNNING");
    expect(running.stage).toBe("RUNNING");
    expect(running.activeSessionsCount).toBeGreaterThan(0);

    const completed = ControlledTrialEngine.transitionStage(trial.trialId, "COMPLETED");
    expect(completed.stage).toBe("COMPLETED");
    expect(completed.completedAt).toBeDefined();
  });
});
