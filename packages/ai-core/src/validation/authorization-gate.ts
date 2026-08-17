/**
 * AuthorizationGate
 *
 * Enforces human authorization boundaries.
 * Distinguishes safe autonomous operations (UI tweaks, bug fixes, non-breaking APIs)
 * from operations requiring explicit human authorization (architecture migration,
 * destructive DB migrations, breaking API changes, data deletion).
 */

export type OperationRiskLevel = "SAFE_AUTONOMOUS" | "REQUIRES_AUTHORIZATION";

export interface AuthorizationEvaluation {
  allowed: boolean;
  riskLevel: OperationRiskLevel;
  action: string;
  reasons: string[];
  status: "AUTHORIZED" | "AWAITING_AUTHORIZATION";
  message: string;
}

export class AuthorizationGate {
  public static evaluateOperation(
    action: string,
    context: {
      isArchitectureMigration?: boolean;
      isDestructiveDatabaseMigration?: boolean;
      isBreakingApiChange?: boolean;
      isDataDeletion?: boolean;
    }
  ): AuthorizationEvaluation {
    const reasons: string[] = [];

    if (context.isArchitectureMigration) {
      reasons.push("Architecture migration alters core runtime and framework choices.");
    }
    if (context.isDestructiveDatabaseMigration) {
      reasons.push("Destructive database migration risks dropping tables or columns with data loss.");
    }
    if (context.isBreakingApiChange) {
      reasons.push("Breaking API change will cause incompatible client integration failures.");
    }
    if (context.isDataDeletion) {
      reasons.push("Operation involves permanent data deletion.");
    }

    const requiresAuth = reasons.length > 0;

    return {
      allowed: !requiresAuth,
      riskLevel: requiresAuth ? "REQUIRES_AUTHORIZATION" : "SAFE_AUTONOMOUS",
      action,
      reasons,
      status: requiresAuth ? "AWAITING_AUTHORIZATION" : "AUTHORIZED",
      message: requiresAuth
        ? `AWAITING_AUTHORIZATION: Operation "${action}" requires explicit human authorization (${reasons.join(" ")})`
        : `AUTHORIZED: Operation "${action}" is safe for autonomous execution.`,
    };
  }
}
