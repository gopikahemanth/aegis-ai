/**
 * AutonomousActionPlanner
 *
 * Translates predictive foresight into candidate proactive actions.
 */

export interface CandidateAction {
  actionId: string;
  projectId: string;
  actionType: "RUN_ADDITIONAL_RECOVERY_TEST" | "INCREASE_OBSERVABILITY" | "REBALANCE_WORK_QUEUE" | "REQUEST_MORE_CAPACITY" | "PREPARE_ROLLBACK" | "REQUEST_HUMAN_REVIEW";
  safetyClassification: "SAFE_AUTOMATION" | "REQUIRES_AUTHORIZATION" | "MANUAL_ONLY" | "BLOCKED";
  predictedBenefit: string;
  predictedRisk: string;
  authorizationRequired: boolean;
}

export class AutonomousActionPlanner {
  public static planAction(
    projectId: string,
    type: CandidateAction["actionType"]
  ): CandidateAction {
    const isSafe = type === "INCREASE_OBSERVABILITY" || type === "RUN_ADDITIONAL_RECOVERY_TEST";
    const classification: CandidateAction["safetyClassification"] = isSafe
      ? "SAFE_AUTOMATION"
      : "REQUIRES_AUTHORIZATION";

    return {
      actionId: `act_plan_${Date.now()}`,
      projectId,
      actionType: type,
      safetyClassification: classification,
      predictedBenefit: "Mitigates forecast failure risk with minimal blast radius",
      predictedRisk: isSafe ? "None" : "Capacity reallocation impact",
      authorizationRequired: !isSafe,
    };
  }
}
