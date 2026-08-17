/**
 * PortfolioIntelligenceEngine
 *
 * Aggregates read-only strategic metrics across all projects, teams, and environments
 * within an organization while strictly preserving tenant and project isolation.
 */

export interface ProjectStrategicMetrics {
  projectId: string;
  reliabilityScore: number;
  securityScore: number;
  technicalDebtScore: number;
  complianceScore: number;
  strategicImportance: "TIER_1_CRITICAL" | "TIER_2_CORE" | "TIER_3_SUPPORTING";
}

export interface OrganizationStrategicPortfolio {
  organizationId: string;
  projects: ProjectStrategicMetrics[];
  averageReliability: number;
  averageSecurity: number;
  averageTechnicalDebt: number;
  overallStrategicHealth: "EXCELLENT" | "STABLE" | "REQUIRES_ATTENTION";
}

export class PortfolioIntelligenceEngine {
  private static projectMetrics: Map<string, ProjectStrategicMetrics[]> = new Map();

  public static recordProjectMetrics(organizationId: string, metrics: ProjectStrategicMetrics): void {
    const list = this.projectMetrics.get(organizationId) || [];
    const idx = list.findIndex((m) => m.projectId === metrics.projectId);
    if (idx >= 0) {
      list[idx] = metrics;
    } else {
      list.push(metrics);
    }
    this.projectMetrics.set(organizationId, list);
  }

  public static analyzePortfolio(organizationId: string): OrganizationStrategicPortfolio {
    const list = this.projectMetrics.get(organizationId) || [];
    if (list.length === 0) {
      return {
        organizationId,
        projects: [],
        averageReliability: 100,
        averageSecurity: 100,
        averageTechnicalDebt: 0,
        overallStrategicHealth: "EXCELLENT",
      };
    }

    const avgRel = list.reduce((sum, p) => sum + p.reliabilityScore, 0) / list.length;
    const avgSec = list.reduce((sum, p) => sum + p.securityScore, 0) / list.length;
    const avgDebt = list.reduce((sum, p) => sum + p.technicalDebtScore, 0) / list.length;

    const health = avgRel < 85 || avgSec < 90 || avgDebt > 50 ? "REQUIRES_ATTENTION" : "STABLE";

    return {
      organizationId,
      projects: list,
      averageReliability: Math.round(avgRel),
      averageSecurity: Math.round(avgSec),
      averageTechnicalDebt: Math.round(avgDebt),
      overallStrategicHealth: health,
    };
  }

  public static reset(): void {
    this.projectMetrics.clear();
  }
}
