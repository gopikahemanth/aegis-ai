/**
 * DeploymentInventory
 *
 * Tracks the authoritative registry of all deployed artifacts, environments,
 * architecture hashes, and live runtime instances.
 */

import type { EnvironmentType } from "./production-state.js";

export interface ActiveDeploymentRecord {
  deploymentId: string;
  projectId: string;
  environment: EnvironmentType;
  releaseId: string;
  generationId: string;
  architectureHash: string;
  databaseSchemaHash: string;
  dependencyHash: string;
  deployedAt: string;
  liveServerUrl?: string;
  activePid?: number;
  status: "ACTIVE" | "SUPERSEDED" | "ROLLED_BACK";
}

export class DeploymentInventory {
  private static records: Map<string, ActiveDeploymentRecord[]> = new Map(); // projectId -> records[]

  /**
   * Register a new active deployment.
   */
  public static registerDeployment(record: ActiveDeploymentRecord): void {
    const list = this.records.get(record.projectId) || [];

    // Mark previous active deployment in same environment as SUPERSEDED
    for (const item of list) {
      if (item.environment === record.environment && item.status === "ACTIVE") {
        item.status = "SUPERSEDED";
      }
    }

    list.push(record);
    this.records.set(record.projectId, list);
  }

  /**
   * Get active deployment for a project in a specific environment.
   */
  public static getActiveDeployment(
    projectId: string,
    environment: EnvironmentType = "production"
  ): ActiveDeploymentRecord | undefined {
    const list = this.records.get(projectId) || [];
    return list.find((r) => r.environment === environment && r.status === "ACTIVE");
  }

  /**
   * List all deployments for a project.
   */
  public static listDeployments(projectId: string): ActiveDeploymentRecord[] {
    return this.records.get(projectId) || [];
  }

  public static reset(): void {
    this.records.clear();
  }
}
