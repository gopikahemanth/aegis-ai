/**
 * EvolutionImpactEngine
 *
 * Evaluates the blast radius, affected services, packages, and teams for proposed evolutions.
 */

export type EvolutionImpactScope =
  | "LOCAL"
  | "PROJECT"
  | "CROSS_PROJECT"
  | "ENTERPRISE"
  | "SYSTEMIC"
  | "BLOCKED";

export interface EvolutionImpactReport {
  opportunityId: string;
  scope: EvolutionImpactScope;
  affectedProjectsCount: number;
  affectedServicesCount: number;
  affectedPackagesCount: number;
  affectedDatabasesCount: number;
  isCrossTenant: boolean;
  summary: string;
}

export class EvolutionImpactEngine {
  public static evaluateImpact(
    opportunityId: string,
    projects: string[],
    services: string[],
    packages: string[],
    databases: string[]
  ): EvolutionImpactReport {
    let scope: EvolutionImpactScope = "LOCAL";

    if (projects.length > 3 || services.length > 5) {
      scope = "SYSTEMIC";
    } else if (projects.length > 1) {
      scope = "CROSS_PROJECT";
    } else if (packages.length > 2 || services.length > 2) {
      scope = "PROJECT";
    }

    return {
      opportunityId,
      scope,
      affectedProjectsCount: projects.length,
      affectedServicesCount: services.length,
      affectedPackagesCount: packages.length,
      affectedDatabasesCount: databases.length,
      isCrossTenant: false,
      summary: `Evolution blast radius evaluated as ${scope} across ${projects.length} project(s) and ${services.length} service(s).`,
    };
  }
}
