/**
 * IdentityManager
 *
 * Multi-user actor modeling and multi-tenant organization boundary enforcement.
 */

export type ActorRole =
  | "VIEWER"
  | "DEVELOPER"
  | "REVIEWER"
  | "PROJECT_ADMIN"
  | "RELEASE_MANAGER"
  | "SECURITY_REVIEWER"
  | "PLATFORM_ADMIN";

export interface Actor {
  userId: string;
  name: string;
  organizationId: string;
  role: ActorRole;
}

export class IdentityManager {
  private static actors: Map<string, Actor> = new Map();

  public static registerActor(actor: Actor): void {
    this.actors.set(actor.userId, actor);
  }

  public static getActor(userId: string): Actor | undefined {
    return this.actors.get(userId);
  }

  /**
   * Check if actor has permission to execute an operation in an environment.
   */
  public static authorizeOperation(
    userId: string,
    operation: "DEPLOY_PRODUCTION" | "DATABASE_MIGRATION" | "CODE_EDIT" | "VIEW",
    targetOrgId: string
  ): { authorized: boolean; reason: string } {
    const actor = this.actors.get(userId);
    if (!actor) {
      return { authorized: false, reason: "UNKNOWN_ACTOR" };
    }

    if (actor.organizationId !== targetOrgId && actor.role !== "PLATFORM_ADMIN") {
      return { authorized: false, reason: "TENANT_ISOLATION_VIOLATION: Cross-tenant access denied." };
    }

    if (operation === "DEPLOY_PRODUCTION" && actor.role !== "PLATFORM_ADMIN" && actor.role !== "RELEASE_MANAGER") {
      return { authorized: false, reason: "INSUFFICIENT_PERMISSIONS: Production deployment requires RELEASE_MANAGER." };
    }

    return { authorized: true, reason: "Operation authorized within tenant policy." };
  }

  public static reset(): void {
    this.actors.clear();
  }
}
