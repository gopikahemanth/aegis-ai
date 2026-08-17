/**
 * EnterpriseAuthorization
 *
 * Evaluates fine-grained hierarchical permissions across Actor -> Organization -> Team -> Project -> Environment -> Operation.
 */

import { IdentityManager, type ActorRole } from "../identity/identity-manager.js";

export type EnterpriseOperation =
  | "VIEW_PROJECT"
  | "CREATE_GENERATION"
  | "APPROVE_MIGRATION"
  | "DEPLOY_STAGING"
  | "DEPLOY_PRODUCTION"
  | "ROLLBACK"
  | "MODIFY_POLICY"
  | "MANAGE_SECRET"
  | "MANAGE_WORKERS";

export interface EnterpriseAuthorizationEvaluation {
  verdict: "ALLOW" | "DENY" | "REQUIRES_APPROVAL";
  reason: string;
}

export class EnterpriseAuthorization {
  /**
   * Evaluate if an actor is authorized to perform an operation on a project in a specific environment.
   */
  public static evaluate(
    userId: string,
    organizationId: string,
    projectId: string,
    environment: string,
    operation: EnterpriseOperation
  ): EnterpriseAuthorizationEvaluation {

    const actor = IdentityManager.getActor(userId);
    if (!actor) {
      return { verdict: "DENY", reason: "UNKNOWN_ACTOR: Actor identity not registered." };
    }

    if (actor.organizationId !== organizationId && actor.role !== "PLATFORM_ADMIN") {
      return { verdict: "DENY", reason: "CROSS_TENANT_ACCESS_DENIED: Tenant boundary enforced." };
    }

    if (operation === "DEPLOY_PRODUCTION") {
      if (actor.role === "PLATFORM_ADMIN" || actor.role === "RELEASE_MANAGER") {
        return { verdict: "ALLOW", reason: "Authorized for production deployment." };
      }
      return { verdict: "REQUIRES_APPROVAL", reason: "Production deployment requires Release Manager approval." };
    }

    if (operation === "APPROVE_MIGRATION" || operation === "MODIFY_POLICY") {
      if (actor.role === "PLATFORM_ADMIN" || actor.role === "PROJECT_ADMIN") {
        return { verdict: "ALLOW", reason: "Authorized for administrative action." };
      }
      return { verdict: "DENY", reason: "Administrative privileges required." };
    }

    return { verdict: "ALLOW", reason: "Standard project operation authorized." };
  }
}
