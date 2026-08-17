import { describe, it, expect, beforeEach } from "vitest";
import { ProductExperimentEngine } from "../product-experiment-engine.js";

describe("AEGIS Phase 37 — Product Experiment Engine", () => {
  beforeEach(() => {
    ProductExperimentEngine.reset();
  });

  it("governs product experiments and enforces canary traffic limits", () => {
    const exp = ProductExperimentEngine.createExperiment(
      "opp_1",
      "proj_gym",
      "flag_live_attendance",
      10,
      1.0,
      24
    );

    expect(exp.experimentId).toBeDefined();
    expect(exp.status).toBe("PROPOSED");

    const running = ProductExperimentEngine.transitionState(exp.experimentId, "RUNNING");
    expect(running.status).toBe("RUNNING");
  });

  it("blocks experiment creation if traffic percentage exceeds safety limits", () => {
    expect(() =>
      ProductExperimentEngine.createExperiment(
        "opp_1",
        "proj_gym",
        "flag_unsafe",
        70, // Exceeds 50%
        1.0,
        24
      )
    ).toThrow();
  });
});
