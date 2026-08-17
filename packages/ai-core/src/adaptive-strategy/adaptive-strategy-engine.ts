/**
 * AdaptiveStrategyEngine
 *
 * Evaluates enterprise strategy adaptation based on verified outcomes,
 * prediction error, capacity, and risk metrics.
 *
 * Core invariant: STRATEGIC RECOMMENDATIONS != STRATEGIC AUTHORIZATION.
 */

export interface AdaptiveStrategyEvaluation {
  evaluationId: string;
  organizationId: string;
  recommendedAction: "CONTINUE_STRATEGY" | "ADJUST_STRATEGY" | "REPLAN" | "DEPRIORITIZE" | "ACCELERATE" | "REQUEST_AUTHORIZATION";
  rationale: string;
  requiresAuthorization: boolean; // Always true for consequential adjustments
}

export class AdaptiveStrategyEngine {
  public static evaluateStrategy(
    organizationId: string,
    outcomeAchievementRate: number,
    capacityUtilization: number
  ): AdaptiveStrategyEvaluation {
    let action: AdaptiveStrategyEvaluation["recommendedAction"] = "CONTINUE_STRATEGY";
    let rationale = "Current strategy is on track and aligned with capacity.";

    if (outcomeAchievementRate < 50) {
      action = "ADJUST_STRATEGY";
      rationale = `Outcome achievement at ${outcomeAchievementRate}%. Strategic adjustment and capacity rebalancing recommended.`;
    } else if (capacityUtilization > 90) {
      action = "REPLAN";
      rationale = `Engineering capacity over-allocated (${capacityUtilization}%). Rebalancing roadmap recommended.`;
    }

    return {
      evaluationId: `eval_adapt_${Date.now()}`,
      organizationId,
      recommendedAction: action,
      rationale,
      requiresAuthorization: action !== "CONTINUE_STRATEGY",
    };
  }
}
