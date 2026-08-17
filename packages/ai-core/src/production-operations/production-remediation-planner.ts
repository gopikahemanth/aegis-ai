/**
 * ProductionRemediationPlanner
 *
 * Converts diagnosed incidents into structured remediation plans.
 * Invariant: DIAGNOSIS ≠ AUTHORIZATION
 * Safety Class: SAFE_AUTOMATION | REQUIRES_AUTHORIZATION | MANUAL_ONLY | BLOCKED
 */

import { RootCauseDiagnosis } from "./production-diagnosis-engine.js";

export type RemediationSafetyClass =
  | "SAFE_AUTOMATION"
  | "REQUIRES_AUTHORIZATION"
  | "MANUAL_ONLY"
  | "BLOCKED";

export type RemediationActionType =
  | "RESTART_SERVICE"
  | "CLEAR_SAFE_CACHE"
  | "ROTATE_PROCESS"
  | "SCALE_WORKERS"
  | "RESTART_DATABASE_POOL"
  | "ROLLBACK_RELEASE"
  | "RESTORE_CONFIGURATION";

export interface RemediationAction {
  actionId: string;
  type: RemediationActionType;
  safetyClass: RemediationSafetyClass;
  description: string;
  targetComponent: string;
  isAuthorized: boolean;
  estimatedRecoveryMs: number;
}

export interface RemediationPlan {
  planId: string;
  diagnosisId: string;
  actions: RemediationAction[];
  primaryAction: RemediationAction;
  isAutoExecutable: boolean;
  requiresHumanApproval: boolean;
  plannedAt: string;
  summary: string;
}

export class ProductionRemediationPlanner {
  public static plan(diagnosis: RootCauseDiagnosis, isExplicitlyAuthorized = false): RemediationPlan {
    const actionType = (diagnosis.recommendedActionType as RemediationActionType) || "RESTART_SERVICE";

    // Define safety classification
    let safetyClass: RemediationSafetyClass = "SAFE_AUTOMATION";
    if (actionType === "ROLLBACK_RELEASE" || actionType === "RESTORE_CONFIGURATION") {
      safetyClass = "REQUIRES_AUTHORIZATION";
    }

    const isAuthorized = safetyClass === "SAFE_AUTOMATION" || isExplicitlyAuthorized;

    const primaryAction: RemediationAction = {
      actionId: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: actionType,
      safetyClass,
      description: `Execute ${actionType} to remediate: ${diagnosis.rootCause}`,
      targetComponent: diagnosis.affectedComponents[0] || "General",
      isAuthorized,
      estimatedRecoveryMs: 2500,
    };

    return {
      planId: `rem_plan_${Date.now()}`,
      diagnosisId: diagnosis.diagnosisId,
      actions: [primaryAction],
      primaryAction,
      isAutoExecutable: isAuthorized,
      requiresHumanApproval: !isAuthorized,
      plannedAt: new Date().toISOString(),
      summary: `Remediation plan: ${actionType} (${safetyClass}). Auto-executable: ${isAuthorized}.`,
    };
  }
}
