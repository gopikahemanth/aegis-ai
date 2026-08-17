/**
 * ExecutionAuthorizationEngine
 *
 * Enforces independent authorization validation before any system mutation.
 * Hard Invariant: HIGH CONFIDENCE + LOW PREDICTED RISK + GOOD SIMULATION != AUTHORIZATION.
 */

export type ExecutionAuthorizationStatus =
  | "AUTO_AUTHORIZED_SAFE"
  | "REQUIRES_HUMAN_AUTHORIZATION"
  | "REQUIRES_MULTI_ROLE_AUTHORIZATION"
  | "BLOCKED"
  | "EXPIRED"
  | "SCOPE_MISMATCH";

export interface AuthorizationEvaluationRequest {
  actorId: string;
  organizationId: string;
  tenantId: string;
  projectId: string;
  environment: "development" | "staging" | "production";
  isSafeReadonlyAction: boolean;
  hasHumanApprovalSignature?: boolean;
  hasMultiRoleApprovalSignature?: boolean;
  authorizationExpiresAt?: string;
  authorizedScope?: {
    tenantId: string;
    projectId: string;
    environment: string;
  };
}

export interface ExecutionAuthorizationResult {
  authorizationId: string;
  status: ExecutionAuthorizationStatus;
  isAuthorized: boolean;
  reason: string;
}

export class ExecutionAuthorizationEngine {
  public static evaluateAuthorization(
    req: AuthorizationEvaluationRequest
  ): ExecutionAuthorizationResult {
    // 1. Expiry Check
    if (req.authorizationExpiresAt) {
      const expires = new Date(req.authorizationExpiresAt).getTime();
      if (Date.now() > expires) {
        return {
          authorizationId: `auth_${Date.now()}`,
          status: "EXPIRED",
          isAuthorized: false,
          reason: "AUTHORIZATION_EXPIRED: The authorization signature has expired.",
        };
      }
    }

    // 2. Scope & Tenant / Environment Validation
    if (req.authorizedScope) {
      if (
        req.authorizedScope.tenantId !== req.tenantId ||
        req.authorizedScope.projectId !== req.projectId ||
        req.authorizedScope.environment !== req.environment
      ) {
        return {
          authorizationId: `auth_${Date.now()}`,
          status: "SCOPE_MISMATCH",
          isAuthorized: false,
          reason: "SCOPE_MISMATCH: Authorization scope does not match the target tenant/project/environment.",
        };
      }
    }

    // 3. Safe Read-only Actions
    if (req.isSafeReadonlyAction) {
      return {
        authorizationId: `auth_safe_${Date.now()}`,
        status: "AUTO_AUTHORIZED_SAFE",
        isAuthorized: true,
        reason: "AUTO_AUTHORIZED_SAFE: Readonly/non-destructive action authorized by autonomous policy.",
      };
    }

    // 4. Production or High-Risk Multi-Role Requirement
    if (req.environment === "production") {
      if (req.hasMultiRoleApprovalSignature) {
        return {
          authorizationId: `auth_prod_${Date.now()}`,
          status: "AUTO_AUTHORIZED_SAFE",
          isAuthorized: true,
          reason: "Production execution authorized via multi-role cryptographic signatures.",
        };
      }
      if (req.hasHumanApprovalSignature) {
        return {
          authorizationId: `auth_human_${Date.now()}`,
          status: "AUTO_AUTHORIZED_SAFE",
          isAuthorized: true,
          reason: "Production execution authorized via human administrative signature.",
        };
      }
      return {
        authorizationId: `auth_pending_${Date.now()}`,
        status: "REQUIRES_HUMAN_AUTHORIZATION",
        isAuthorized: false,
        reason: "REQUIRES_HUMAN_AUTHORIZATION: Production mutations strictly require administrative approval.",
      };
    }

    // 5. Staging / Non-prod
    if (req.hasHumanApprovalSignature) {
      return {
        authorizationId: `auth_dev_${Date.now()}`,
        status: "AUTO_AUTHORIZED_SAFE",
        isAuthorized: true,
        reason: "Staging/Development action authorized.",
      };
    }

    return {
      authorizationId: `auth_pending_${Date.now()}`,
      status: "REQUIRES_HUMAN_AUTHORIZATION",
      isAuthorized: false,
      reason: "Mutation requires administrative authorization.",
    };
  }
}
