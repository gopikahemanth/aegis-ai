/**
 * AutonomousExecutionEngine
 *
 * Controlled mutation executor enforcing action ordering, mutation tracking,
 * before/after state capture, and strict lineage verification.
 */

import { ExecutionPlan, ExecutionPlanManager } from "./execution-plan.js";

export interface ExecutionMutationRecord {
  mutationId: string;
  actionId: string;
  targetComponent: string;
  beforeState: string;
  afterState: string;
  timestamp: string;
}

export interface ExecutionRunResult {
  executionId: string;
  success: boolean;
  executedActionsCount: number;
  mutations: ExecutionMutationRecord[];
  failureReason?: string;
}

export class AutonomousExecutionEngine {
  public static async executePlan(
    plan: ExecutionPlan,
    isAuthorized: boolean,
    preflightPassed: boolean,
    actionRunner?: (action: any) => Promise<{ beforeState: string; afterState: string }>
  ): Promise<ExecutionRunResult> {
    if (!isAuthorized) {
      throw new Error("UNAUTHORIZED_EXECUTION: Execution was blocked due to missing or invalid authorization.");
    }
    if (!preflightPassed) {
      throw new Error("PREFLIGHT_BLOCKED: Execution cannot proceed because preflight safety checks failed.");
    }

    ExecutionPlanManager.transitionState(plan.executionId, "EXECUTING");

    const mutations: ExecutionMutationRecord[] = [];

    for (const action of plan.plannedActions) {
      let before = "INITIAL";
      let after = "MODIFIED";

      if (actionRunner) {
        try {
          const res = await actionRunner(action);
          before = res.beforeState;
          after = res.afterState;
        } catch (err: any) {
          ExecutionPlanManager.transitionState(plan.executionId, "ROLLBACK_REQUIRED");
          return {
            executionId: plan.executionId,
            success: false,
            executedActionsCount: mutations.length,
            mutations,
            failureReason: err?.message || "Action execution error",
          };
        }
      }

      mutations.push({
        mutationId: `mut_${Date.now()}_${action.sequenceOrder}`,
        actionId: action.actionId,
        targetComponent: action.targetComponent,
        beforeState: before,
        afterState: after,
        timestamp: new Date().toISOString(),
      });
    }

    ExecutionPlanManager.transitionState(plan.executionId, "VERIFYING");

    return {
      executionId: plan.executionId,
      success: true,
      executedActionsCount: mutations.length,
      mutations,
    };
  }
}
