/**
 * SystemicRiskAnalyzer
 *
 * Analyzes cross-project dependencies to detect single points of failure,
 * cascading risks, and common infrastructure failure domains.
 */

export interface SystemicRiskFinding {
  findingId: string;
  type: "SINGLE_POINT_OF_FAILURE" | "CASCADE_RISK" | "DEPENDENCY_RISK" | "COMMON_MODE_FAILURE";
  sourceProjectId: string;
  dependentProjects: string[];
  blastRadius: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export class SystemicRiskAnalyzer {
  public static analyzeDependencies(
    dependencies: Array<{ sourceProject: string; targetProject: string; isCritical: boolean }>
  ): SystemicRiskFinding[] {
    const findings: SystemicRiskFinding[] = [];
    const inDegreeMap = new Map<string, string[]>();

    for (const dep of dependencies) {
      const list = inDegreeMap.get(dep.targetProject) || [];
      list.push(dep.sourceProject);
      inDegreeMap.set(dep.targetProject, list);
    }

    for (const [target, sources] of inDegreeMap.entries()) {
      if (sources.length >= 2) {
        findings.push({
          findingId: `sys_find_${Date.now()}_${target}`,
          type: "SINGLE_POINT_OF_FAILURE",
          sourceProjectId: target,
          dependentProjects: sources,
          blastRadius: sources.length >= 3 ? "CRITICAL" : "HIGH",
          recommendation: `Project "${target}" is a single point of failure depended upon by ${sources.join(", ")}. Introduce redundant caching or circuit breaker.`,
        });
      }
    }

    return findings;
  }
}
