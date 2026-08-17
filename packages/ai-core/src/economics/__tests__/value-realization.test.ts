import { describe, it, expect } from "vitest";
import { ValueRealizationEngine } from "../value-realization-engine.js";

describe("AEGIS Phase 26 — Value Realization Engine", () => {
  it("calculates verified ROI and realization efficiency rates", () => {
    const report = ValueRealizationEngine.calculateRealization(
      "init_gym_core",
      "gym_proj",
      50000,
      200000,
      180000
    );

    expect(report.realizationRate).toBe(90);
    expect(report.verifiedROI).toBe(3.6);
    expect(report.efficiencyStatus).toBe("HIGH_EFFICIENCY");
  });
});
