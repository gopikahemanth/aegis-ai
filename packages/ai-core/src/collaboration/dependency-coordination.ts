/**
 * DependencyCoordinationEngine
 *
 * Models cross-project & cross-team engineering dependencies without shared mutable state.
 */

export interface CrossProjectDependency {
  dependencyId: string;
  sourceProjectId: string;
  targetProjectId: string;
  type: "API_CONTRACT" | "DATA_SCHEMA" | "RELEASE_ORDER";
  description: string;
}

export class DependencyCoordinationEngine {
  private static dependencies: CrossProjectDependency[] = [];

  public static registerDependency(dep: CrossProjectDependency): void {
    this.dependencies.push(dep);
  }

  public static getImpactedProjects(projectId: string): string[] {
    return this.dependencies
      .filter((d) => d.sourceProjectId === projectId)
      .map((d) => d.targetProjectId);
  }

  public static reset(): void {
    this.dependencies = [];
  }
}
