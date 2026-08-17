import { describe, it, expect } from "vitest";
import { AutonomousImprovementEngine } from "../autonomous-improvement-engine.js";
import { ImprovementPlanningEngine } from "../improvement-planning-engine.js";
import { ImprovementContractEngine } from "../improvement-contract-engine.js";
import { PrioritizedItem } from "../improvement-prioritization-engine.js";

describe("AEGIS Phase 60 — Autonomous Improvement Engine", () => {
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

  it("applies bounded atomic patches and captures pre-mutation checkpoint", async () => {
    const res = await AutonomousImprovementEngine.executeImprovement(plan);
    expect(res.isImplemented).toBe(true);
    expect(res.totalPatchesApplied).toBe(2);
    expect(res.checkpointId).toContain("chkpt_imp_pass");
    expect(res.requiresHumanIntervention).toBe(false);
  });

  it("escalates to human intervention when execution fails bounded limit", async () => {
    const res = await AutonomousImprovementEngine.executeImprovement(plan, {
      simulateExecutionFailure: true,
    });
    expect(res.isImplemented).toBe(false);
    expect(res.requiresHumanIntervention).toBe(true);
  });
});
