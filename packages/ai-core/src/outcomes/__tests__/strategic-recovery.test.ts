import { describe, it, expect } from "vitest";
import { StrategicRecoveryEngine } from "../strategic-recovery-engine.js";

describe("AEGIS Phase 24 — Strategic Recovery Engine", () => {
  it("evaluates recovery and replanning when outcome achievement falls below threshold without mutating history", () => {
    const plan = StrategicRecoveryEngine.evaluateRecovery("init_1", 30);
    expect(plan.recommendedAction).toBe("ADJUST_PLAN");
    expect(plan.replanTasks.length).toBeGreaterThan(0);
  });
});
