/**
 * ChangeOpportunityEngine
 *
 * Discovers system improvement and change opportunities from incidents, reliability degradation,
 * technical debt, security findings, and historical outcomes.
 * Hard Invariant: OPPORTUNITY != CHANGE. Discovery must never mutate repository state.
 */

export interface SystemChangeOpportunity {
  opportunityId: string;
  projectId: string;
  source: string;
  evidenceSummary: string;
  confidence: number;
  affectedProjects: string[];
  affectedTeams: string[];
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  expectedBenefitINR: number;
  discoveredAt: string;
}

export class ChangeOpportunityEngine {
  public static discoverOpportunities(
    projectId: string,
    incidentsCount: number,
    technicalDebtRatio: number,
    securityFindingsCount: number
  ): SystemChangeOpportunity[] {
    const opps: SystemChangeOpportunity[] = [];
    const now = new Date().toISOString();

    if (incidentsCount > 0) {
      opps.push({
        opportunityId: `chg_opp_${Date.now()}_inc`,
        projectId,
        source: "INCIDENT_RETROSPECTIVE",
        evidenceSummary: `${incidentsCount} verified operational incident(s) resolved with architectural remediation recommendations.`,
        confidence: 0.95,
        affectedProjects: [projectId],
        affectedTeams: ["team_platform"],
        risk: "LOW",
        expectedBenefitINR: 120000,
        discoveredAt: now,
      });
    }

    if (technicalDebtRatio > 0.25) {
      opps.push({
        opportunityId: `chg_opp_${Date.now()}_debt`,
        projectId,
        source: "CODEBASE_ANALYSIS",
        evidenceSummary: `Technical debt ratio exceeds 25% across legacy query routes.`,
        confidence: 0.91,
        affectedProjects: [projectId],
        affectedTeams: ["team_backend"],
        risk: "MODERATE",
        expectedBenefitINR: 75000,
        discoveredAt: now,
      });
    }

    if (securityFindingsCount > 0) {
      opps.push({
        opportunityId: `chg_opp_${Date.now()}_sec`,
        projectId,
        source: "SECURITY_AUDIT",
        evidenceSummary: `${securityFindingsCount} dependency security advisory item(s) detected.`,
        confidence: 0.98,
        affectedProjects: [projectId],
        affectedTeams: ["team_security"],
        risk: "LOW",
        expectedBenefitINR: 150000,
        discoveredAt: now,
      });
    }

    return opps;
  }
}
