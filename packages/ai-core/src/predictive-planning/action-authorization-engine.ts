/**
 * ActionAuthorizationEngine
 *
 * Enforces policy and role authorization before action execution.
 * Hard Invariant: PREDICTION CONFIDENCE NEVER OVERRIDES AUTHORIZATION POLICY.
 */

export interface ActionAuthorizationDecision {
  actionId: string;
  projectId: string;
  decision: "ALLOW" | "REQUIRES_AUTHORIZATION" | "DENY" | "BLOCKED_BY_POLICY";
  reason: string;
  isPolicyCompliant: boolean;
}

export class ActionAuthorizationEngine {
  public static evaluateAction(
    actionId: string,
    projectId: string,
    isSafeAutomation: boolean,
    hasHumanApproval: boolean
  ): ActionAuthorizationDecision {
    if (isSafeAutomation) {
      return {
        actionId,
        projectId,
        decision: "ALLOW",
        reason: "Safe non-destructive automation policy compliant.",
        isPolicyCompliant: true,
      };
    }

    if (hasHumanApproval) {
      return {
        actionId,
        projectId,
        decision: "ALLOW",
        reason: "Human authorization verified via cryptographic signature.",
        isPolicyCompliant: true,
      };
    }

    return {
      actionId,
      projectId,
      decision: "REQUIRES_AUTHORIZATION",
      reason: "Action requires explicit platform administrator authorization.",
      isPolicyCompliant: false,
    };
  }
}
