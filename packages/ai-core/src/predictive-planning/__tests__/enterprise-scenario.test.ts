import { describe, it, expect } from "vitest";
import { EnterpriseScenarioEngine } from "../enterprise-scenario-engine.js";

describe("AEGIS Phase 32 — Enterprise Scenario Engine", () => {
  it("simulates strategic what-if scenarios with strictly ZERO mutations", () => {
    const report = EnterpriseScenarioEngine.simulateScenario(
      "Reduce AI Worker Capacity by 20%",
      -8,
      -15000,
      -20,
      14
    );

    expect(report.classification).toBe("SIMULATED");
    expect(report.mutationsAttempted).toBe(0);
    expect(report.projectedOutcomeRiskDeltaPercentage).toBe(14);
  });
});
