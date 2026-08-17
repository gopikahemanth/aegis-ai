/**
 * ArchitectureIntelligenceEngine
 *
 * Discovers architectural patterns, divergence, and standardization opportunities across an enterprise portfolio.
 */

export interface ArchitectureFinding {
  type: "ARCHITECTURE_DIVERGENCE" | "STANDARDIZATION_OPPORTUNITY" | "OUTDATED_STACK";
  projects: string[];
  recommendation: string;
}

export class ArchitectureIntelligenceEngine {
  public static analyzePortfolioArchitectures(projectArchitectures: Array<{ projectId: string; frontend: string; backend: string; database: string }>): ArchitectureFinding[] {
    const findings: ArchitectureFinding[] = [];

    const dbTypes = new Set(projectArchitectures.map((p) => p.database));
    if (dbTypes.size > 1) {
      findings.push({
        type: "ARCHITECTURE_DIVERGENCE",
        projects: projectArchitectures.map((p) => p.projectId),
        recommendation: `Multiple database engines detected (${Array.from(dbTypes).join(", ")}). Recommend standardizing on PostgreSQL.`,
      });
    }

    return findings;
  }
}
