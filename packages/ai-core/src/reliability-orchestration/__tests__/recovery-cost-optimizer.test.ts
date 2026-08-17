import { describe, it, expect } from "vitest";
import { RecoveryCostOptimizer } from "../recovery-cost-optimizer.js";

describe("AEGIS Phase 30 — Recovery Cost Optimizer", () => {
  it("evaluates net financial benefit and marks high-value interventions", () => {
    const eco = RecoveryCostOptimizer.evaluateEconomics("proj_core", 15000, 250000);
    expect(eco.recommendation).toBe("HIGH_VALUE");
    expect(eco.netBenefitINR).toBe(235000);
  });
});
