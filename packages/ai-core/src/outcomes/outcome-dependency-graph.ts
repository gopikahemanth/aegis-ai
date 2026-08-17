/**
 * OutcomeDependencyGraph
 *
 * Models dependencies between strategic business outcomes, initiatives, and projects.
 */

export interface OutcomeDependency {
  dependencyId: string;
  sourceOutcomeId: string;
  targetOutcomeId: string;
  relationshipType: "ENABLES" | "BLOCKS" | "REQUIRES";
}

export class OutcomeDependencyGraph {
  private static dependencies: OutcomeDependency[] = [];

  public static addDependency(dep: OutcomeDependency): void {
    this.dependencies.push(dep);
  }

  public static getDependencies(outcomeId: string): OutcomeDependency[] {
    return this.dependencies.filter((d) => d.targetOutcomeId === outcomeId);
  }

  public static reset(): void {
    this.dependencies = [];
  }
}
