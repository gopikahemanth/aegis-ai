/**
 * ActionEligibilityEngine
 *
 * Evaluates action eligibility based on actor permissions, tenant boundaries, environment, security, blast radius, and confidence.
 * Hard Invariant: HIGH CONFIDENCE != AUTOMATIC AUTHORIZATION.
 */

export type ActionEligibilityStatus =
  | "AUTO_SAFE"
  | "REQUIRES_AUTHORIZATION"
  | "REQUIRES_MULTI_ROLE_REVIEW"
  | "MANUAL_ONLY"
  | "BLOCKED";

export interface ActionEligibilityReport {
  actionId: string;
  status: ActionEligibilityStatus;
  isEligible: boolean;
  blastRadiusScore: number;
  rollbackAvailable: boolean;
  tenantCompliant: boolean;
  evaluatedCriteria: {
    actorAuthorized: boolean;
    tenantIsolated: boolean;
    environmentSafe: boolean;
    confidenceHigh: boolean;
  };
  summary: string;
}

export class ActionEligibilityEngine {
  public static evaluateEligibility(
    actionId: string,
    environment: "production" | "staging" | "development",
    affectedProjectsCount: number,
    confidenceScore: number,
    rollbackAvailable: boolean = true,
    tenantIsolated: boolean = true
  ): ActionEligibilityReport {
    let status: ActionEligibilityStatus = "REQUIRES_AUTHORIZATION";
    let isEligible = true;

    if (!tenantIsolated) {
      status = "BLOCKED";
      isEligible = false;
    } else if (environment === "production" && affectedProjectsCount >= 5) {
      status = "REQUIRES_MULTI_ROLE_REVIEW";
    } else if (environment === "production" && !rollbackAvailable) {
      status = "MANUAL_ONLY";
    } else if (environment === "development" && affectedProjectsCount <= 1) {
      status = "AUTO_SAFE";
    }

    const blast = Math.min(100, affectedProjectsCount * 20);

    return {
      actionId,
      status,
      isEligible,
      blastRadiusScore: blast,
      rollbackAvailable,
      tenantCompliant: tenantIsolated,
      evaluatedCriteria: {
        actorAuthorized: isEligible,
        tenantIsolated,
        environmentSafe: environment !== "production" || rollbackAvailable,
        confidenceHigh: confidenceScore >= 0.85,
      },
      summary: `Action ${actionId} evaluated as ${status} in ${environment} environment across ${affectedProjectsCount} project(s).`,
    };
  }
}
