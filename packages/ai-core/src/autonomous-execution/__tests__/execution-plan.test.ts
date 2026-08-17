import { describe, it, expect, beforeEach } from "vitest";
import { ExecutionPlanManager } from "../execution-plan.js";

describe("AEGIS Phase 33 — Execution Plan Manager", () => {
  beforeEach(() => {
    ExecutionPlanManager.reset();
  });

  it("creates lineage-bound execution plans and enforces state machine transitions", () => {
    const plan = ExecutionPlanManager.createPlan({
      tenantId: "t_core",
      organizationId: "org_alpha",
      projectId: "proj_api",
      environment: "production",
      sourcePredictionId: "fc_perf_1",
      sourceDecisionId: "dec_opt_2",
      plannedActions: [
        { actionId: "act_1", actionType: "APPLY_CONFIG", targetComponent: "Gateway", sequenceOrder: 1 },
      ],
      preconditions: ["Backup fresh", "No active incidents"],
      expectedImpact: "Increase throughput by 20%",
      riskLevel: "MODERATE",
      rollbackPlan: {
        rollbackActionId: "rb_1",
        rollbackSteps: ["Revert config to previous snapshot"],
        isDeterministic: true,
      },
      verificationPlan: {
        verificationSteps: ["Check HTTP 200 latency"],
        requiredConfidence: 0.95,
      },
      resourceBudget: {
        maxTokens: 50000,
        maxComputeMs: 10000,
        maxDbMutations: 10,
      },
      createdBy: "lead_dev_1",
    });

    expect(plan.status).toBe("PLANNED");
    expect(plan.executionId).toBeDefined();

    const authorized = ExecutionPlanManager.transitionState(plan.executionId, "AUTHORIZED");
    expect(authorized.status).toBe("AUTHORIZED");
  });

  it("rejects plans with invalid lineage or missing rollback steps", () => {
    expect(() =>
      ExecutionPlanManager.createPlan({
        tenantId: "t_core",
        organizationId: "org_alpha",
        projectId: "proj_api",
        environment: "production",
        sourcePredictionId: "",
        sourceDecisionId: "",
        plannedActions: [],
        preconditions: [],
        expectedImpact: "",
        riskLevel: "LOW",
        rollbackPlan: { rollbackActionId: "", rollbackSteps: [], isDeterministic: true },
        verificationPlan: { verificationSteps: [], requiredConfidence: 0.9 },
        resourceBudget: { maxTokens: 0, maxComputeMs: 0, maxDbMutations: 0 },
        createdBy: "user",
      })
    ).toThrow();
  });
});
