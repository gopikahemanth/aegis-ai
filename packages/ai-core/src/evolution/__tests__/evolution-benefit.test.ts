import { describe, it, expect } from "vitest";
import { EvolutionBenefitEngine } from "../evolution-benefit-engine.js";

describe("AEGIS Phase 35 — Evolution Benefit Engine", () => {
  it("quantifies estimated ROI and expected reliability gain", () => {
    const est = EvolutionBenefitEngine.estimateBenefit("opp_1", 100000, 20000, 25);
    expect(est.classification).toBe("VERY_HIGH_VALUE");
    expect(est.roiRatio).toBe(5);
    expect(est.expectedReliabilityGainPercentage).toBe(25);
  });
});
