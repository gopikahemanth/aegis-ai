/**
 * RemediationPolicyEngine
 *
 * Enforces governed remediation policies:
 * AUTO_REPAIR_SAFE -> REQUIRES_AUTHORIZATION -> MANUAL_INTERVENTION -> DO_NOT_REPAIR_AUTOMATICALLY
 */

import type { IncidentRecord } from "./incident-engine.js";

export type RemediationSafetyPolicy =
  | "AUTO_REPAIR_SAFE"
  | "REQUIRES_AUTHORIZATION"
  | "MANUAL_INTERVENTION"
  | "DO_NOT_REPAIR_AUTOMATICALLY";

export interface RemediationPlan {
  planId: string;
  incidentId: string;
  policy: RemediationSafetyPolicy;
  suggestedAction: "RESTART_PROCESS" | "ROLLBACK_DEPLOYMENT" | "DATABASE_RESTORE" | "MANUAL_INVESTIGATION";
  requiresAuthorization: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

export class RemediationPolicyEngine {
  /**
   * Evaluate remediation safety policy for an active incident.
   */
  public static evaluatePolicy(incident: IncidentRecord): RemediationPlan {
    const planId = `rem_${Date.now()}_${incident.incidentId}`;

    if (incident.severity === "CRITICAL") {
      // Critical regressions require emergency rollback with authorization
      return {
        planId,
        incidentId: incident.incidentId,
        policy: "REQUIRES_AUTHORIZATION",
        suggestedAction: "ROLLBACK_DEPLOYMENT",
        requiresAuthorization: true,
        risk: "HIGH",
        rationale: "Critical production failure detected. Verified rollback to previous release candidate requires authorization.",
      };
    }

    if (incident.classification === "DATABASE_FAILURE") {
      return {
        planId,
        incidentId: incident.incidentId,
        policy: "REQUIRES_AUTHORIZATION",
        suggestedAction: "DATABASE_RESTORE",
        requiresAuthorization: true,
        risk: "HIGH",
        rationale: "Database schema or data corruption requires verified snapshot restore with human authorization.",
      };
    }

    if (incident.severity === "LOW") {
      return {
        planId,
        incidentId: incident.incidentId,
        policy: "AUTO_REPAIR_SAFE",
        suggestedAction: "RESTART_PROCESS",
        requiresAuthorization: false,
        risk: "LOW",
        rationale: "Minor transient failure. Safe automatic process restart permitted.",
      };
    }

    return {
      planId,
      incidentId: incident.incidentId,
      policy: "MANUAL_INTERVENTION",
      suggestedAction: "MANUAL_INVESTIGATION",
      requiresAuthorization: false,
      risk: "MEDIUM",
      rationale: "Complex failure requiring developer investigation.",
    };
  }
}
