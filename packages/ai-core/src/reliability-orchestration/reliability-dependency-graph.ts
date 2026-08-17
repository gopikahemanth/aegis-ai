/**
 * ReliabilityDependencyGraph
 *
 * Models cross-project dependency topologies, blast radii, and cascading failure paths.
 */

export interface ReliabilityDependencyEdge {
  sourceProject: string;
  targetProject: string;
  dependencyType: "DATABASE" | "API_SERVICE" | "WORKER_POOL" | "AUTH_PROVIDER";
  isCritical: boolean;
}

export interface DependencyAnalysisReport {
  project: string;
  dependentCount: number;
  blastRadius: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  isSinglePointOfFailure: boolean;
  cascadingRiskProjects: string[];
}

export class ReliabilityDependencyGraph {
  public static analyzeGraph(
    targetProject: string,
    edges: ReliabilityDependencyEdge[]
  ): DependencyAnalysisReport {
    const dependents = edges.filter((e) => e.targetProject === targetProject).map((e) => e.sourceProject);
    const isSpof = dependents.length >= 2;
    const blastRadius = dependents.length >= 3 ? "CRITICAL" : dependents.length >= 1 ? "HIGH" : "LOW";

    return {
      project: targetProject,
      dependentCount: dependents.length,
      blastRadius,
      isSinglePointOfFailure: isSpof,
      cascadingRiskProjects: dependents,
    };
  }
}
