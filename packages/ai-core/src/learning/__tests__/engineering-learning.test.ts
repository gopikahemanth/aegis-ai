import { describe, it, expect, beforeEach } from "vitest";
import { EngineeringLearningEngine } from "../engineering-learning-engine.js";

describe("AEGIS Phase 17 — Learning from Verified Outcomes", () => {
  beforeEach(() => {
    EngineeringLearningEngine.clear();
  });

  it("measures accuracy between predictions and actual outcomes, calibrating confidence heuristics", () => {
    const obs1 = EngineeringLearningEngine.recordOutcome(
      "LATENCY_RECOVERY",
      "RECOVERED",
      "RECOVERED"
    );
    expect(obs1.accuracy).toBe(1.0);
    expect(obs1.calibratedConfidence).toBe(0.95);

    const obs2 = EngineeringLearningEngine.recordOutcome(
      "DEPENDENCY_PATCH",
      "SUCCESS",
      "FAILED"
    );
    expect(obs2.accuracy).toBe(0.0);
    expect(obs2.calibratedConfidence).toBe(0.70);

    expect(EngineeringLearningEngine.getAverageAccuracy()).toBe(0.5);
  });
});
