/**
 * ChangeImpactEngine
 *
 * Evaluates the blast radius of proposed enterprise changes.
 * Hard Invariant: PREDICTED IMPACT != OBSERVED IMPACT.
 */

export type ChangeImpactScope =
  | "ISOLATED"
  | "LIMITED"
  | "CROSS_PROJECT"
  | "ENTERPRISE_WIDE"
  | "CRITICAL_SYSTEMIC";

export interface EnterpriseChangeImpactReport {
  changeId: string;
  scope: ChangeImpactScope;
  affectedProjectsCount: number;
  affectedServicesCount: number;
  affectedApisCount: number;
  affectedDatabasesCount: number;
  sloDegradationRisk: boolean;
  classification: "PREDICTED_IMPACT";
  summary: string;
}

export class ChangeImpactEngine {
  public static calculateImpact(
    changeId: string,
    projects: string[],
    services: string[],
    apis: string[],
    databases: string[]
  ): EnterpriseChangeImpactReport {
    let scope: ChangeImpactScope = "ISOLATED";

    if (projects.length > 3 || services.length > 5) {
      scope = "CRITICAL_SYSTEMIC";
    } else if (projects.length > 1) {
      scope = "CROSS_PROJECT";
    } else if (services.length > 2 || databases.length > 1) {
      scope = "LIMITED";
    }

    return {
      changeId,
      scope,
      affectedProjectsCount: projects.length,
      affectedServicesCount: services.length,
      affectedApisCount: apis.length,
      affectedDatabasesCount: databases.length,
      sloDegradationRisk: scope === "CRITICAL_SYSTEMIC",
      classification: "PREDICTED_IMPACT",
      summary: `Change impact evaluated as ${scope} across ${projects.length} project(s) and ${services.length} service(s).`,
    };
  }
}

