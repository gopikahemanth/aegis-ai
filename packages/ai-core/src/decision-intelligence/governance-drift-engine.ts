/**
 * GovernanceDriftEngine
 *
 * Detects policy deviations, unauthorized mutations, or tenant boundary violations.
 */

export interface GovernanceDriftReport {
  organizationId: string;
  projectId: string;
  authorizationViolationsCount: number;
  tenantBoundaryViolationsCount: number;
  securityPolicyDeviationsCount: number;
  driftClassification: "NO_DRIFT" | "MINOR_DRIFT" | "SIGNIFICANT_DRIFT" | "CRITICAL_DRIFT";
  isBlocked: boolean;
  summary: string;
}

export class GovernanceDriftEngine {
  public static evaluateDrift(
    organizationId: string,
    projectId: string,
    authViolations: number,
    tenantViolations: number,
    secDeviations: number
  ): GovernanceDriftReport {
    let drift: GovernanceDriftReport["driftClassification"] = "NO_DRIFT";
    let isBlocked = false;

    if (tenantViolations > 0 || authViolations > 2) {
      drift = "CRITICAL_DRIFT";
      isBlocked = true;
    } else if (authViolations > 0 || secDeviations > 1) {
      drift = "SIGNIFICANT_DRIFT";
    } else if (secDeviations > 0) {
      drift = "MINOR_DRIFT";
    }

    return {
      organizationId,
      projectId,
      authorizationViolationsCount: authViolations,
      tenantBoundaryViolationsCount: tenantViolations,
      securityPolicyDeviationsCount: secDeviations,
      driftClassification: drift,
      isBlocked,
      summary: `Governance drift evaluation: ${drift}. Blocked: ${isBlocked}.`,
    };
  }
}
