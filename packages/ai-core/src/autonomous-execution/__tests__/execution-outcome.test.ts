import { describe, it, expect } from "vitest";
import { ExecutionOutcomeEngine } from "../execution-outcome-engine.js";


describe("AEGIS Phase 33 — Execution Outcome Engine", () => {
  it("reconciles expected vs observed effect and classifies business outcome", () => {
    const report = ExecutionOutcomeEngine.reconcileOutcome("exec_1", "proj_api", 20, 24, 50000);
    expect(report.classification).toBe("SUCCESS");
    expect(report.observedKpiDeltaPercentage).toBe(24);
    expect(report.roiRealizedINR).toBe(50000);
  });

  it("detects REGRESSION if observed KPI movement is negative", () => {
    const report = ExecutionOutcomeEngine.reconcileOutcome("exec_1", "proj_api", 20, -5, -10000);
    expect(report.classification).toBe("REGRESSION");
  });
});
