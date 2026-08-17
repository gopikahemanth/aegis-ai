import { describe, it, expect } from "vitest";
import { ChangeOutcomeEngine } from "../change-outcome-engine.js";

describe("AEGIS Phase 34 — Change Outcome Engine", () => {
  it("evaluates outcome realization and value attribution", () => {
    const report = ChangeOutcomeEngine.evaluateOutcome("chg_1", "proj_api", 20, 22, 75000);
    expect(report.classification).toBe("EXPECTED_SUCCESS");
    expect(report.observedKpiDelta).toBe(22);
    expect(report.valueAttributionINR).toBe(75000);
  });

  it("classifies outcome as REGRESSION if observed KPI movement is negative", () => {
    const report = ChangeOutcomeEngine.evaluateOutcome("chg_1", "proj_api", 20, -10, -25000);
    expect(report.classification).toBe("REGRESSION");
  });
});
