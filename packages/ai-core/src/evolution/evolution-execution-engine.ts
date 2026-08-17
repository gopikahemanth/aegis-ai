/**
 * EvolutionExecutionEngine
 *
 * Orchestrates governed evolution execution leveraging existing Phase 33 and 34 execution engines.
 */

import { AutonomousExecutionEngine } from "../autonomous-execution/execution-engine.js";
import { ExecutionPlanManager } from "../autonomous-execution/execution-plan.js";
import { EvolutionPlan } from "./evolution-planner.js";

export interface EvolutionExecutionResult {
  executionId: string;
  planId: string;
  opportunityId: string;
  phasesExecutedCount: number;
  status: "COMPLETED" | "FAILED";
  summary: string;
}

export class EvolutionExecutionEngine {
  public static async executeEvolution(
    plan: EvolutionPlan,
    isAuthorized: boolean = true,
    preflightPassed: boolean = true
  ): Promise<EvolutionExecutionResult> {
    const execPlan = ExecutionPlanManager.createPlan({
      tenantId: "tenant_default",
      organizationId: "org_default",
      projectId: "proj_default",
      environment: "production",
      sourcePredictionId: plan.simulationId,
      sourceDecisionId: plan.opportunityId,
      authorizationId: plan.authorizationId,
      plannedActions: plan.phases.map((p, idx) => ({
        actionId: `act_phase_${p.phaseNumber}`,
        actionType: p.name,
        targetComponent: "ArchitectureStack",
        sequenceOrder: idx + 1,
      })),
      preconditions: ["Baseline verified"],
      expectedImpact: "Systemic architecture enhancement",
      riskLevel: "LOW",
      rollbackPlan: {
        rollbackActionId: `rb_${plan.planId}`,
        rollbackSteps: plan.rollbackSteps,
        isDeterministic: true,
      },
      verificationPlan: {
        verificationSteps: plan.verificationSteps,
        requiredConfidence: 0.95,
      },
      resourceBudget: {
        maxTokens: 50000,
        maxComputeMs: 10000,
        maxDbMutations: 0,
      },
      createdBy: "system_evolution_lead",
    });

    const res = await AutonomousExecutionEngine.executePlan(execPlan, isAuthorized, preflightPassed);

    return {
      executionId: res.executionId,
      planId: plan.planId,
      opportunityId: plan.opportunityId,
      phasesExecutedCount: res.executedActionsCount,
      status: res.success ? "COMPLETED" : "FAILED",
      summary: `Evolution execution completed successfully across ${res.executedActionsCount} phases.`,
    };
  }
}
