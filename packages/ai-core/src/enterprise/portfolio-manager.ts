/**
 * PortfolioManager
 *
 * Tracks multi-project portfolio health, releases, security posture, and compliance across an organization.
 */

export interface PortfolioProjectSummary {
  projectId: string;
  name: string;
  health: "HEALTHY" | "DEGRADED" | "BLOCKED" | "UPGRADING";
  securityStatus: "CERTIFIED" | "AUDITING" | "VULNERABLE";
  lastReleaseId?: string;
}

export interface OrganizationPortfolio {
  organizationId: string;
  projects: PortfolioProjectSummary[];
  overallStatus: "HEALTHY" | "DEGRADED" | "ACTION_REQUIRED";
}

export class PortfolioManager {
  private static portfolios: Map<string, PortfolioProjectSummary[]> = new Map();

  public static trackProject(organizationId: string, project: PortfolioProjectSummary): void {
    const list = this.portfolios.get(organizationId) || [];
    const idx = list.findIndex((p) => p.projectId === project.projectId);
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.push(project);
    }
    this.portfolios.set(organizationId, list);
  }

  public static getPortfolio(organizationId: string): OrganizationPortfolio {
    const projects = this.portfolios.get(organizationId) || [];
    const hasBlocked = projects.some((p) => p.health === "BLOCKED");
    const hasDegraded = projects.some((p) => p.health === "DEGRADED");

    return {
      organizationId,
      projects,
      overallStatus: hasBlocked ? "ACTION_REQUIRED" : hasDegraded ? "DEGRADED" : "HEALTHY",
    };
  }

  public static reset(): void {
    this.portfolios.clear();
  }
}
