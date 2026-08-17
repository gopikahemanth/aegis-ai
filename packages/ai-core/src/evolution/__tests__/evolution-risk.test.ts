import { describe, it, expect } from "vitest";
import { EvolutionRiskEngine } from "../evolution-risk-engine.js";

describe("AEGIS Phase 35 — Evolution Risk Engine", () => {
  it("quantifies risk and enforces policy boundaries", () => {
    const report = EvolutionRiskEngine.evaluateRisk({
      opportunityId: "opp_1",
      hasRollbackPlan: true,
      isDatabaseRestructure: false,
      affectedComponentsCount: 2,
      historicalFailureRate: 0,
    });

    expect(report.riskLevel).toBe("LOW");
    expect(report.governanceBypassPermitted).toBe(false);
  });

  it("blocks evolution if rollback plan is missing", () => {
    const report = EvolutionRiskEngine.evaluateRisk({
      opportunityId: "opp_norb",
      hasRollbackPlan: false,
      isDatabaseRestructure: false,
      affectedComponentsCount: 1,
      historicalFailureRate: 0,
    });

    expect(report.riskLevel).toBe("BLOCKED");
  });
});
