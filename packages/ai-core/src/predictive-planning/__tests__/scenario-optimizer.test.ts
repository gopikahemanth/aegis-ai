import { describe, it, expect } from "vitest";
import { EnterpriseScenarioOptimizer } from "../enterprise-scenario-optimizer.js";

describe("AEGIS Phase 32 — Enterprise Scenario Optimizer", () => {
  it("ranks scenarios by expected value score while maintaining recommendations-only invariant", () => {
    const ranked = EnterpriseScenarioOptimizer.rankScenarios([
      { scenarioName: "Scale Workers Conservatively", expectedValueScore: 75, riskScore: 20, costImpactINR: 10000, isRecommended: false },
      { scenarioName: "Accelerate Strategic Gateway V2", expectedValueScore: 94, riskScore: 15, costImpactINR: 15000, isRecommended: false },
    ]);

    expect(ranked[0].scenarioName).toBe("Accelerate Strategic Gateway V2");
    expect(ranked[0].isRecommended).toBe(true);
    expect(ranked[1].isRecommended).toBe(false);
  });
});
