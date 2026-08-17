import { describe, it, expect } from "vitest";
import { ImprovementPlanningEngine } from "../improvement-planning-engine.js";
import { ImprovementContractEngine } from "../improvement-contract-engine.js";
import { PrioritizedItem } from "../improvement-prioritization-engine.js";

describe("AEGIS Phase 60 — Improvement Planning Engine", () => {
  it("translates contract into deterministic 5-step execution plan", () => {
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
    const plan = ImprovementPlanningEngine.createPlan(contract);

    expect(plan.steps.length).toBe(5);
    expect(plan.steps[0].action).toContain("Batch Membership Plan");
    expect(plan.steps[2].action).toContain("Regression");
  });
});
