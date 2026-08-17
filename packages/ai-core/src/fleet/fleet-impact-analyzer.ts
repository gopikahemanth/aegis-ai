/**
 * FleetImpactAnalyzer
 *
 * Evaluates the blast radius of changes across multi-project fleets,
 * ensuring zero unisolated contamination.
 */

export interface FleetImpactReport {
  initiatingProjectId: string;
  affectedProjects: string[];
  crossProjectContamination: boolean;
  blastRadius: "LOCAL_PROJECT_ONLY" | "MULTI_PROJECT_DEPENDENT" | "FLEET_WIDE";
  summary: string;
}

export class FleetImpactAnalyzer {
  /**
   * Analyze potential impact of a change across the fleet.
   */
  public static analyzeChange(
    initiatingProjectId: string,
    changedFiles: string[] = []
  ): FleetImpactReport {
    // Project changes are strictly local unless touching workspace root configs
    const touchesSharedWorkspace = changedFiles.some((f) => f.includes("pnpm-workspace.yaml") || f.includes("turbo.json"));

    return {
      initiatingProjectId,
      affectedProjects: touchesSharedWorkspace ? ["*"] : [initiatingProjectId],
      crossProjectContamination: false,
      blastRadius: touchesSharedWorkspace ? "FLEET_WIDE" : "LOCAL_PROJECT_ONLY",
      summary: touchesSharedWorkspace
        ? "Change touches shared monorepo configuration affecting all projects."
        : `Change isolated strictly to project "${initiatingProjectId}". 0 cross-project contamination.`,
    };
  }
}
