/**
 * ReleaseLineageTracker
 *
 * Tracks the complete genealogical lineage of project generations:
 * G1 -> G2 -> ... -> GN
 * associating parent generation, releases, deployments, incidents, and rollbacks.
 */

export interface LineageNode {
  generationId: string;
  parentGenerationId?: string;
  projectId: string;
  releaseId?: string;
  deploymentId?: string;
  createdAt: string;
  contractHashes: {
    architectureHash?: string;
    domainHash?: string;
    dataHash?: string;
    apiHash?: string;
    dependencyHash?: string;
  };
  incidentIds: string[];
  rolledBack: boolean;
}

export class ReleaseLineageTracker {
  private static lineages: Map<string, LineageNode[]> = new Map(); // projectId -> nodes[]

  /**
   * Record a generation node in the lineage.
   */
  public static recordNode(node: LineageNode): void {
    const list = this.lineages.get(node.projectId) || [];
    list.push(node);
    this.lineages.set(node.projectId, list);
  }

  /**
   * Get full lineage tree for a project.
   */
  public static getLineage(projectId: string): LineageNode[] {
    return this.lineages.get(projectId) || [];
  }

  public static reset(): void {
    this.lineages.clear();
  }
}
