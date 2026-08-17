import { describe, it, expect, beforeEach } from "vitest";
import { ExecutionRollbackEngine } from "../execution-rollback-engine.js";
import { ExecutionPlanManager } from "../execution-plan.js";

describe("AEGIS Phase 33 — Execution Rollback Engine", () => {
  beforeEach(() => {
    ExecutionPlanManager.reset();
  });

  it("executes and verifies deterministic rollback when authorized", async () => {
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
      rollbackPlan: { rollbackActionId: "rb_1", rollbackSteps: ["Revert snapshot"], isDeterministic: true },
      verificationPlan: { verificationSteps: [], requiredConfidence: 0.9 },
      resourceBudget: { maxTokens: 0, maxComputeMs: 0, maxDbMutations: 0 },
      createdBy: "admin",
    });

    const res = await ExecutionRollbackEngine.executeRollback(
      plan.executionId,
      true,
      async () => ({ restoredHash: "BASE_HASH_123", success: true })
    );

    expect(res.rollbackState).toBe("VERIFIED");
    expect(res.isVerified).toBe(true);
    expect(res.restoredStateHash).toBe("BASE_HASH_123");
  });

  it("holds rollback in REQUIRED state if authorization is not provided", async () => {
    const res = await ExecutionRollbackEngine.executeRollback("exec_unauth", false);
    expect(res.rollbackState).toBe("REQUIRED");
    expect(res.isVerified).toBe(false);
  });
});
