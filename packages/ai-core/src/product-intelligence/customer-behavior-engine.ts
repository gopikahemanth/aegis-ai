/**
 * CustomerBehaviorEngine
 *
 * Analyzes aggregate customer usage metrics, retention trends, and workflow completion health.
 * Hard Invariant: Never infer sensitive individual traits; all metrics are aggregated.
 */

export type CustomerBehaviorHealth =
  | "HEALTHY"
  | "IMPROVING"
  | "STABLE"
  | "DECLINING"
  | "AT_RISK"
  | "INSUFFICIENT_EVIDENCE";

export interface CustomerBehaviorProfile {
  projectId: string;
  activeUsersCount: number;
  retentionRatePercentage: number;
  avgDailyInteractionsPerUser: number;
  workflowCompletionRate: number;
  healthState: CustomerBehaviorHealth;
  summary: string;
}

export class CustomerBehaviorEngine {
  public static evaluateBehavior(
    projectId: string,
    activeUsers: number,
    retentionRate: number,
    interactionsPerUser: number,
    completionRate: number
  ): CustomerBehaviorProfile {
    let healthState: CustomerBehaviorHealth = "HEALTHY";

    if (activeUsers < 5) {
      healthState = "INSUFFICIENT_EVIDENCE";
    } else if (retentionRate < 60 || completionRate < 0.7) {
      healthState = "AT_RISK";
    } else if (retentionRate < 80) {
      healthState = "DECLINING";
    } else if (retentionRate > 90 && completionRate >= 0.9) {
      healthState = "IMPROVING";
    }

    return {
      projectId,
      activeUsersCount: activeUsers,
      retentionRatePercentage: retentionRate,
      avgDailyInteractionsPerUser: interactionsPerUser,
      workflowCompletionRate: completionRate,
      healthState,
      summary: `Customer usage health evaluated as ${healthState} with ${retentionRate}% retention and ${(completionRate * 100).toFixed(0)}% workflow completion.`,
    };
  }
}
