import { describe, it, expect } from "vitest";
import { EvolutionOutcomeEngine } from "../evolution-outcome-engine.js";

describe("AEGIS Phase 35 — Evolution Outcome Engine", () => {
  it("evaluates outcome realization, realized ROI, and value attribution", () => {
    const report = EvolutionOutcomeEngine.evaluateOutcome(
      "opp_1",
      "proj_gym",
      25,
      28,
      80000,
      95000,
      20000
    );

    expect(report.classification).toBe("IMPROVEMENT_REALIZED");
    expect(report.actualReliabilityGain).toBe(28);
    expect(report.realizedRoi).toBe(4.75);
  });

  it("classifies outcome as REGRESSION if reliability delta is negative", () => {
    const report = EvolutionOutcomeEngine.evaluateOutcome(
      "opp_1",
      "proj_gym",
      25,
      -5,
      80000,
      -15000,
      20000
    );

    expect(report.classification).toBe("REGRESSION");
  });
});
