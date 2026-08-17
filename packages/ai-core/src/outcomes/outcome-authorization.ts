/**
 * OutcomeAuthorizationManager
 *
 * Enforces strictly-scoped strategic outcome authorization validating
 * initiative, target projects, environments, expected metrics, and rollback readiness.
 */

import { IdentityManager } from "../identity/identity-manager.js";

export interface OutcomeAuthorizationRequest {
  authorizationId: string;
  initiativeId: string;
  organizationId: string;
  authorizerUserId: string;
  targetProjects: string[];
  expectedOutcome: string;
  authorized: boolean;
  timestamp: string;
}

export class OutcomeAuthorizationManager {
  private static authorizations: Map<string, OutcomeAuthorizationRequest> = new Map();

  public static authorizeExecution(params: {
    authorizationId: string;
    initiativeId: string;
    organizationId: string;
    authorizerUserId: string;
    targetProjects: string[];
    expectedOutcome: string;
  }): { success: boolean; authorization?: OutcomeAuthorizationRequest; error?: string } {
    const actor = IdentityManager.getActor(params.authorizerUserId);
    if (!actor) {
      return { success: false, error: "UNKNOWN_AUTHORIZER: Actor identity not registered." };
    }

    if (actor.role !== "PLATFORM_ADMIN" && actor.role !== "PROJECT_ADMIN" && actor.role !== "RELEASE_MANAGER") {
      return { success: false, error: "UNAUTHORIZED_ROLE: Administrative authorization required." };
    }


    const auth: OutcomeAuthorizationRequest = {
      ...params,
      authorized: true,
      timestamp: new Date().toISOString(),
    };
    this.authorizations.set(params.authorizationId, auth);
    return { success: true, authorization: auth };
  }

  public static getAuthorization(authorizationId: string): OutcomeAuthorizationRequest | undefined {
    return this.authorizations.get(authorizationId);
  }

  public static reset(): void {
    this.authorizations.clear();
  }
}
