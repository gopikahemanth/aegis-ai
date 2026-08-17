/**
 * InnovationImpactEngine
 *
 * Evaluates blast radius, contract changes, and tenant isolation boundaries for proposed innovations.
 */

export type InnovationImpactLevel =
  | "LOCAL"
  | "PROJECT"
  | "CROSS_PROJECT"
  | "ENTERPRISE"
  | "SYSTEMIC"
  | "BLOCKED";

export interface InnovationImpactReport {
  opportunityId: string;
  impactLevel: InnovationImpactLevel;
  affectedProjectsCount: number;
  affectedApisCount: number;
  affectedDatabasesCount: number;
  tenantIsolationPreserved: boolean;
  requiresMigration: boolean;
  summary: string;
}

export class InnovationImpactEngine {
  public static evaluateImpact(
    opportunityId: string,
    projects: string[],
    apis: string[],
    databases: string[],
    isCrossTenant: boolean = false
  ): InnovationImpactReport {
    if (isCrossTenant) {
      return {
        opportunityId,
        impactLevel: "BLOCKED",
        affectedProjectsCount: projects.length,
        affectedApisCount: apis.length,
        affectedDatabasesCount: databases.length,
        tenantIsolationPreserved: false,
        requiresMigration: false,
        summary: "TENANT_ISOLATION_VIOLATION: Innovation violates cross-tenant boundary.",
      };
    }

    let impactLevel: InnovationImpactLevel = "LOCAL";
    if (projects.length > 3 || apis.length > 6) {
      impactLevel = "SYSTEMIC";
    } else if (projects.length > 1) {
      impactLevel = "CROSS_PROJECT";
    } else if (apis.length > 2 || databases.length > 1) {
      impactLevel = "PROJECT";
    }

    return {
      opportunityId,
      impactLevel,
      affectedProjectsCount: projects.length,
      affectedApisCount: apis.length,
      affectedDatabasesCount: databases.length,
      tenantIsolationPreserved: true,
      requiresMigration: databases.length > 0,
      summary: `Innovation blast radius evaluated as ${impactLevel} across ${projects.length} project(s) and ${apis.length} API(s).`,
    };
  }
}
