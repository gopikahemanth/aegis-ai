import { describe, it, expect, beforeEach } from "vitest";
import { AutonomousExecutionEngine } from "../execution-engine.js";
import { ExecutionPlanManager } from "../execution-plan.js";

describe("AEGIS Phase 33 — Autonomous Execution Engine", () => {
  beforeEach(() => {
    ExecutionPlanManager.reset();
  });

  it("executes approved actions and captures before/after mutation states", async () => {
    const plan = ExecutionPlanManager.createPlan({
      tenantId: "t_core",
      organizationId: "org_alpha",
      projectId: "proj_api",
      environment: "production",
      sourcePredictionId: "fc_1",
      sourceDecisionId: "dec_1",
      plannedActions: [
        { actionId: "act_1", actionType: "REBALANCE_POOL", targetComponent: "DBPool", sequenceOrder: 1 },
      ],
      preconditions: ["Clean"],
      expectedImpact: "Optimized pool",
      riskLevel: "LOW",
      rollbackPlan: { rollbackActionId: "rb_1", rollbackSteps: ["Reset pool"], isDeterministic: true },
      verificationPlan: { verificationSteps: ["Ping"], requiredConfidence: 0.9 },
      resourceBudget: { maxTokens: 1000, maxComputeMs: 1000, maxDbMutations: 1 },
      createdBy: "admin",
    });

    const res = await AutonomousExecutionEngine.executePlan(
      plan,
      true,
      true,
      async (action) => ({ beforeState: "POOL_SIZE_10", afterState: "POOL_SIZE_25" })
    );

    expect(res.success).toBe(true);
    expect(res.mutations.length).toBe(1);
    expect(res.mutations[0].afterState).toBe("POOL_SIZE_25");
  });

  it("rejects unauthorized execution attempts", async () => {
    const plan = ExecutionPlanManager.createPlan({
      tenantId: "t_core",
      organizationId: "org_alpha",
      projectId: "proj_api",
      environment: "production",
      sourcePredictionId: "fc_1",
      sourceDecisionId: "dec_1",
      plannedActions: [],
      preconditions: [],
      expectedImpact: "",
      riskLevel: "LOW",
      rollbackPlan: { rollbackActionId: "rb_1", rollbackSteps: ["Step"], isDeterministic: true },
      verificationPlan: { verificationSteps: [], requiredConfidence: 0.9 },
      resourceBudget: { maxTokens: 0, maxComputeMs: 0, maxDbMutations: 0 },
      createdBy: "admin",
    });

    await expect(AutonomousExecutionEngine.executePlan(plan, false, true)).rejects.toThrow("UNAUTHORIZED_EXECUTION");
  });
});
