/**
 * ExecutionPlanManager & ExecutionPlan Model
 *
 * Defines the canonical lineage-bound execution plan model and state machine:
 * PLANNED -> AUTHORIZED -> PREFLIGHT -> READY -> EXECUTING -> CANARY -> PROMOTING -> VERIFYING -> COMPLETED
 * Failure paths:
 * EXECUTING/CANARY/VERIFYING -> ROLLBACK_REQUIRED -> ROLLING_BACK -> ROLLED_BACK
 */

export type AutonomousExecutionPlanState =
  | "PLANNED"
  | "AUTHORIZED"
  | "PREFLIGHT"
  | "READY"
  | "EXECUTING"
  | "CANARY"
  | "PROMOTING"
  | "VERIFYING"
  | "COMPLETED"
  | "ROLLBACK_REQUIRED"
  | "ROLLING_BACK"
  | "ROLLED_BACK";

export interface PlannedAction {
  actionId: string;
  actionType: string;
  targetComponent: string;
  mutationPayload?: Record<string, any>;
  sequenceOrder: number;
}

export interface ExecutionPlan {
  executionId: string;
  tenantId: string;
  organizationId: string;
  projectId: string;
  environment: string;
  sourcePredictionId: string;
  sourceDecisionId: string;
  authorizationId?: string;
  plannedActions: PlannedAction[];
  preconditions: string[];
  expectedImpact: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  rollbackPlan: {
    rollbackActionId: string;
    rollbackSteps: string[];
    isDeterministic: boolean;
  };
  verificationPlan: {
    verificationSteps: string[];
    requiredConfidence: number;
  };
  resourceBudget: {
    maxTokens: number;
    maxComputeMs: number;
    maxDbMutations: number;
  };
  createdAt: string;
  createdBy: string;
  status: AutonomousExecutionPlanState;
}

export class ExecutionPlanManager {
  private static plans: Map<string, ExecutionPlan> = new Map();

  public static createPlan(
    planData: Omit<ExecutionPlan, "executionId" | "createdAt" | "status">
  ): ExecutionPlan {
    if (!planData.sourceDecisionId || !planData.sourcePredictionId) {
      throw new Error("INVALID_LINEAGE: Execution plan must reference sourceDecisionId and sourcePredictionId.");
    }
    if (!planData.rollbackPlan || !planData.rollbackPlan.rollbackSteps.length) {
      throw new Error("ROLLBACK_PLAN_REQUIRED: Execution plan must define deterministic rollback steps.");
    }

    const executionId = `exec_plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const plan: ExecutionPlan = {
      ...planData,
      executionId,
      createdAt: new Date().toISOString(),
      status: "PLANNED",
    };

    this.plans.set(executionId, plan);
    return plan;
  }

  public static transitionState(executionId: string, newState: AutonomousExecutionPlanState): ExecutionPlan {

    const plan = this.plans.get(executionId);
    if (!plan) throw new Error(`Execution plan ${executionId} not found.`);

    plan.status = newState;
    this.plans.set(executionId, plan);
    return plan;
  }

  public static getPlan(executionId: string): ExecutionPlan | undefined {
    return this.plans.get(executionId);
  }

  public static listPlans(): ExecutionPlan[] {
    return Array.from(this.plans.values());
  }

  public static reset(): void {
    this.plans.clear();
  }
}
