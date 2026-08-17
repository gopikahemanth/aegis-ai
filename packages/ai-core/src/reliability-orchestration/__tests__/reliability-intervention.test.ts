import { describe, it, expect } from "vitest";
import { ReliabilityInterventionOptimizer } from "../reliability-intervention-optimizer.js";

describe("AEGIS Phase 30 — Reliability Intervention Optimizer", () => {
  it("selects the safest intervention based on comprehensive safety score", () => {
    const safest = ReliabilityInterventionOptimizer.selectSafestIntervention([
      { interventionType: "RESTART", riskReduction: 40, successProbability: 60, blastRadius: "LOW", estimatedRecoverySeconds: 30, costINR: 0, safetyScore: 50 },
      { interventionType: "FAILOVER", riskReduction: 95, successProbability: 98, blastRadius: "LOW", estimatedRecoverySeconds: 45, costINR: 1000, safetyScore: 94 },
    ]);

    expect(safest.interventionType).toBe("FAILOVER");
    expect(safest.safetyScore).toBe(94);
  });
});
