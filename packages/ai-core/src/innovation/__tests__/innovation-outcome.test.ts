import { describe, it, expect } from "vitest";
import { InnovationOutcomeEngine } from "../innovation-outcome-engine.js";

describe("AEGIS Phase 36 — Innovation Outcome Engine", () => {
  it("evaluates verified business value realization and ROI", () => {
    const report = InnovationOutcomeEngine.evaluateOutcome(
      "opp_1",
      "proj_gym",
      120000,
      125000,
      120000,
      20000
    );

    expect(report.classification).toBe("VALUE_REALIZED");
    expect(report.verifiedValueINR).toBe(120000);
    expect(report.realizedRoi).toBe(6.0);
  });

  it("classifies outcome as REGRESSION if verified value movement is negative", () => {
    const report = InnovationOutcomeEngine.evaluateOutcome(
      "opp_1",
      "proj_gym",
      120000,
      -10000,
      -15000,
      20000
    );

    expect(report.classification).toBe("REGRESSION");
  });
});
