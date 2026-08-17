/**
 * EnvironmentRegistry
 *
 * Enforces strict environment boundaries and prevents cross-environment mutation bleed.
 */

import type { EnvironmentType } from "./production-state.js";

export interface EnvironmentConfig {
  environment: EnvironmentType;
  allowedMutations: ("SCHEMA_MIGRATION" | "CODE_DEPLOY" | "CONFIG_UPDATE" | "EMERGENCY_ROLLBACK")[];
  requiresAuthorization: boolean;
  canaryAllowed: boolean;
}

export class EnvironmentRegistry {
  private static readonly ENVIRONMENT_POLICIES: Record<EnvironmentType, EnvironmentConfig> = {
    development: {
      environment: "development",
      allowedMutations: ["SCHEMA_MIGRATION", "CODE_DEPLOY", "CONFIG_UPDATE", "EMERGENCY_ROLLBACK"],
      requiresAuthorization: false,
      canaryAllowed: false,
    },
    test: {
      environment: "test",
      allowedMutations: ["SCHEMA_MIGRATION", "CODE_DEPLOY", "CONFIG_UPDATE", "EMERGENCY_ROLLBACK"],
      requiresAuthorization: false,
      canaryAllowed: false,
    },
    staging: {
      environment: "staging",
      allowedMutations: ["SCHEMA_MIGRATION", "CODE_DEPLOY", "CONFIG_UPDATE", "EMERGENCY_ROLLBACK"],
      requiresAuthorization: false,
      canaryAllowed: true,
    },
    canary: {
      environment: "canary",
      allowedMutations: ["CODE_DEPLOY", "CONFIG_UPDATE", "EMERGENCY_ROLLBACK"],
      requiresAuthorization: true,
      canaryAllowed: true,
    },
    production: {
      environment: "production",
      allowedMutations: ["CODE_DEPLOY", "CONFIG_UPDATE", "EMERGENCY_ROLLBACK", "SCHEMA_MIGRATION"],
      requiresAuthorization: true,
      canaryAllowed: true,
    },
  };

  /**
   * Validate mutation authority against target environment.
   */
  public static validateMutation(
    projectId: string,
    targetEnvironment: EnvironmentType,
    mutationType: EnvironmentConfig["allowedMutations"][number]
  ): { valid: boolean; error?: string } {
    const policy = this.ENVIRONMENT_POLICIES[targetEnvironment];
    if (!policy) {
      return {
        valid: false,
        error: `PROJECT_ENVIRONMENT_MISMATCH: Unknown environment "${targetEnvironment}".`,
      };
    }

    if (!policy.allowedMutations.includes(mutationType)) {
      return {
        valid: false,
        error: `PROJECT_ENVIRONMENT_MISMATCH: Mutation "${mutationType}" is forbidden in "${targetEnvironment}".`,
      };
    }

    return { valid: true };
  }

  public static getPolicy(env: EnvironmentType): EnvironmentConfig {
    return this.ENVIRONMENT_POLICIES[env];
  }
}
