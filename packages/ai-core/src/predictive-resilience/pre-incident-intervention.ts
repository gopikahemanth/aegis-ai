/**
 * PreIncidentInterventionPlanner
 *
 * Generates proactive, governed pre-incident interventions.
 * Invariant: PLANNING != MUTATION.
 */

export interface PreIncidentIntervention {
  interventionId: string;
  projectId: string;
  action: "RUN_BACKUP_VERIFICATION" | "RUN_RESTORE_TEST" | "INCREASE_CAPACITY" | "ROTATE_FAILOVER_TARGET" | "ISOLATE_DEPENDENCY";
  riskReductionPercentage: number;
  costImpactINR: number;
  authorizationRequired: boolean;
  mutationsAttempted: number; // Strictly 0 during planning
}

export class PreIncidentInterventionPlanner {
  public static planIntervention(
    projectId: string,
    action: PreIncidentIntervention["action"],
    riskReduction: number
  ): PreIncidentIntervention {
    const requiresAuth = action === "INCREASE_CAPACITY" || action === "ROTATE_FAILOVER_TARGET";

    return {
      interventionId: `interv_${Date.now()}`,
      projectId,
      action,
      riskReductionPercentage: riskReduction,
      costImpactINR: action === "INCREASE_CAPACITY" ? 15000 : 0,
      authorizationRequired: requiresAuth,
      mutationsAttempted: 0, // Guarantees zero mutations during planning
    };
  }
}
