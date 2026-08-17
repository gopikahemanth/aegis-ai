/**
 * FleetManager
 *
 * Authoritative registry managing multi-project fleets with strict workspace isolation,
 * independent cache namespaces, and fleet-wide health aggregation.
 */

import { ProductionStateManager, type ProductionState } from "../operations/production-state.js";
import { DeploymentInventory } from "../operations/deployment-inventory.js";

export interface ManagedProject {
  projectId: string;
  name: string;
  projectPath: string;
  createdAt: string;
  tier: "PRODUCTION" | "STAGING" | "INTERNAL";
  environments: string[];
}

export interface FleetHealthSummary {
  totalProjects: number;
  healthyProjects: number;
  atRiskProjects: number;
  totalActiveIncidents: number;
  fleetAvailabilityPercent: number;
  timestamp: string;
  projects: Array<{
    projectId: string;
    health: string;
    activeIncidents: number;
    currentRelease?: string;
  }>;
}

export class FleetManager {
  private static registeredProjects: Map<string, ManagedProject> = new Map();

  /**
   * Register a project into the fleet registry.
   */
  public static registerProject(project: ManagedProject): void {
    this.registeredProjects.set(project.projectId, project);
  }

  /**
   * Get project from fleet registry.
   */
  public static getProject(projectId: string): ManagedProject | undefined {
    return this.registeredProjects.get(projectId);
  }

  /**
   * List all projects in the fleet.
   */
  public static listProjects(): ManagedProject[] {
    return Array.from(this.registeredProjects.values());
  }

  /**
   * Synthesize aggregated fleet-wide health metrics without cross-project mutation.
   */
  public static getFleetHealth(): FleetHealthSummary {
    const list = this.listProjects();
    let healthyCount = 0;
    let totalIncidents = 0;

    const projectSummaries = list.map((p) => {
      const state = ProductionStateManager.getState(p.projectId, "production");
      const activeDep = DeploymentInventory.getActiveDeployment(p.projectId, "production");
      const isHealthy = state.healthStatus === "HEALTHY" || state.healthStatus === "UNKNOWN";

      if (isHealthy) healthyCount++;
      totalIncidents += state.activeIncidentsCount;

      return {
        projectId: p.projectId,
        health: state.healthStatus,
        activeIncidents: state.activeIncidentsCount,
        currentRelease: activeDep?.releaseId,
      };
    });

    const total = list.length || 1;
    const availability = Math.round((healthyCount / total) * 1000) / 10;

    return {
      totalProjects: list.length,
      healthyProjects: healthyCount,
      atRiskProjects: list.length - healthyCount,
      totalActiveIncidents: totalIncidents,
      fleetAvailabilityPercent: availability,
      timestamp: new Date().toISOString(),
      projects: projectSummaries,
    };
  }

  public static reset(): void {
    this.registeredProjects.clear();
  }
}
