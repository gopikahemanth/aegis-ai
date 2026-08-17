import { describe, it, expect } from "vitest";
import { ImprovementContractEngine } from "../improvement-contract-engine.js";
import { PrioritizedItem } from "../improvement-prioritization-engine.js";

describe("AEGIS Phase 60 — Improvement Contract Engine", () => {
  it("builds rigorous improvement contract with acceptance boundaries and constraints", () => {
    const item: PrioritizedItem = {
      problemId: "prob_1",
      rank: 1,
      priorityTier: "P1_HIGH",
      title: "High Mobile Checkout Abandonment",
      userImpactScore: 92,
      businessImpactScore: 95,
      technicalEffort: "LOW",
      regressionRisk: "LOW",
      rationale: "Fix checkout drop-off",
    };

    const contract = ImprovementContractEngine.buildContract(item);
    expect(contract.contractId).toContain("contract_imp");
    expect(contract.acceptanceCriteria.length).toBeGreaterThanOrEqual(4);
    expect(contract.constraints.length).toBeGreaterThanOrEqual(3);
    expect(contract.riskLevel).toBe("LOW");
  });
});
