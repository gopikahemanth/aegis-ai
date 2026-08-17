import { describe, it, expect } from "vitest";
import { AutonomousDecisionEngine } from "../autonomous-decision-engine.js";

describe("AEGIS Phase 17 — Autonomous Decision Engine", () => {
  it("synthesizes multi-stream signals and decides authorization request for database failures", () => {
    const decision = AutonomousDecisionEngine.evaluate("gym_proj", {
      isDatabaseFailing: true,
      recentReleaseId: "rel_102",
    });

    expect(decision.action).toBe("REQUEST_AUTHORIZATION");
    expect(decision.targetReleaseId).toBe("rel_102");
    expect(decision.confidence).toBeGreaterThan(0.9);
    expect(decision.evidence.supportingEvidence.length).toBeGreaterThan(0);
  });

  it("decides simulation when performance latency anomaly is detected", () => {
    const decision = AutonomousDecisionEngine.evaluate("gym_proj", {
      isLatencySpike: true,
    });

    expect(decision.action).toBe("SIMULATE");
    expect(decision.confidence).toBeGreaterThan(0.85);
  });
});
