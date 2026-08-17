/**
 * EngineeringPolicyEngine
 *
 * One central policy evaluator governing all autonomous mutations:
 * ALLOW / REVIEW / BLOCK.
 */

export interface EngineeringPolicyDecision {
  action: string;
  verdict: "ALLOW" | "REVIEW" | "BLOCK";
  requiresHumanAuthorization: boolean;
  reasons: string[];
}

export class EngineeringPolicyEngine {
  /**
   * Evaluate mutation authority and safety policy.
   */
  public static evaluateAction(
    actionType: "CODE_CHANGE" | "SCHEMA_MIGRATION" | "DEPLOYMENT" | "ROLLBACK" | "EMERGENCY_REPAIR",
    environment: string,
    isDestructive: boolean = false
  ): EngineeringPolicyDecision {
    const reasons: string[] = [];

    if (isDestructive) {
      reasons.push("Destructive operations require explicit human authorization.");
      return {
        action: actionType,
        verdict: "REVIEW",
        requiresHumanAuthorization: true,
        reasons,
      };
    }

    if (environment === "production" && (actionType === "DEPLOYMENT" || actionType === "ROLLBACK")) {
      reasons.push("Production deployment/rollback requires human sign-off.");
      return {
        action: actionType,
        verdict: "REVIEW",
        requiresHumanAuthorization: true,
        reasons,
      };
    }

    return {
      action: actionType,
      verdict: "ALLOW",
      requiresHumanAuthorization: false,
      reasons: ["Standard non-destructive action within policy parameters."],
    };
  }
}
