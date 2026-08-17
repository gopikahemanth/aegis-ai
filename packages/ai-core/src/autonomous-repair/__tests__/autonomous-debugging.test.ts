import { describe, it, expect } from "vitest";
import { AutonomousDebuggingEngine } from "../autonomous-debugging-engine.js";

describe("AEGIS Phase 57 — Autonomous Debugging Engine", () => {
  it("runs the full autonomous debugging loop and patches defect on attempt 1", async () => {
    const result = await AutonomousDebuggingEngine.executeDebuggingLoop(
      "Payment endpoint returns 500 error due to foreign key failure"
    );

    expect(result.isResolved).toBe(true);
    expect(result.totalAttempts).toBe(1);
    expect(result.requiresHumanIntervention).toBe(false);
    expect(result.diagnosis.isDiagnosed).toBe(true);
    expect(result.appliedPatch?.isApplied).toBe(true);
  });

  it("escalates to human intervention when unresolvable after max attempts", async () => {
    const result = await AutonomousDebuggingEngine.executeDebuggingLoop(
      "Unknown non-deterministic external network failure",
      { simulateUnresolvable: true }
    );

    expect(result.isResolved).toBe(false);
    expect(result.totalAttempts).toBe(5);
    expect(result.requiresHumanIntervention).toBe(true);
  });
});
