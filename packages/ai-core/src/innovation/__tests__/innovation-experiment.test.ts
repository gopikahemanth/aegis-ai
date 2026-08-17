import { describe, it, expect, beforeEach } from "vitest";
import { InnovationExperimentEngine } from "../innovation-experiment-engine.js";

describe("AEGIS Phase 36 — Innovation Experiment Engine", () => {
  beforeEach(() => {
    InnovationExperimentEngine.reset();
  });

  it("creates governed experiments with explicit scope and failure thresholds", () => {
    const exp = InnovationExperimentEngine.createExperiment(
      "opp_1",
      "proj_gym",
      "variant_live_attendance_v1",
      10,
      "latency < 50ms & 0 errors",
      1.0,
      1800
    );

    expect(exp.experimentId).toBeDefined();
    expect(exp.targetTrafficPercentage).toBe(10);
    expect(exp.status).toBe("PROPOSED");

    const running = InnovationExperimentEngine.transitionState(exp.experimentId, "RUNNING");
    expect(running.status).toBe("RUNNING");
  });

  it("blocks experiment creation if traffic percentage exceeds safety limits", () => {
    expect(() =>
      InnovationExperimentEngine.createExperiment(
        "opp_1",
        "proj_gym",
        "variant_unsafe",
        75, // Exceeds 50%
        "metrics",
        1.0
      )
    ).toThrow();
  });
});
