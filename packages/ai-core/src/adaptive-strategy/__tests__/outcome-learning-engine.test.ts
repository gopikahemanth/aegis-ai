import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeLearningEngine } from "../outcome-learning-engine.js";

describe("AEGIS Phase 25 — Outcome Learning Engine", () => {
  beforeEach(() => {
    OutcomeLearningEngine.reset();
  });

  it("calibrates model prediction accuracy without mutating governance policies", () => {
    const record = OutcomeLearningEngine.recordCalibration("init_1", 100, 95);
    expect(record.predictionAccuracy).toBe(95);
    expect(record.predictionError).toBe(5);
    expect(OutcomeLearningEngine.getCalibrationHistory().length).toBe(1);
  });
});
