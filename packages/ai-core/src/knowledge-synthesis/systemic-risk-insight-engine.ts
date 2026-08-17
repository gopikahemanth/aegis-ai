/**
 * SystemicRiskInsightEngine
 *
 * Detects systemic, cascading, and shared-dependency risks across multiple enterprise projects.
 * Hard Invariant: Never automatically executes remediation without governance authorization.
 */

export type SystemicRiskSeverity =
  | "LOCAL_RISK"
  | "CROSS_PROJECT_RISK"
  | "SYSTEMIC_RISK"
  | "ENTERPRISE_CRITICAL_RISK";

export interface SystemicRiskInsight {
  riskId: string;
  title: string;
  severity: SystemicRiskSeverity;
  affectedProjects: string[];
  vulnerableComponent: string;
  blastRadiusScore: number; // 0 to 100
  recommendedMitigation: string;
  supportingEvidenceIds: string[];
  detectedAt: string;
}

export class SystemicRiskInsightEngine {
  public static evaluateRisk(
    title: string,
    affectedProjectsCount: number,
    component: string,
    evidence: string[]
  ): SystemicRiskInsight {
    let severity: SystemicRiskSeverity = "LOCAL_RISK";
    let blast = 20;

    if (affectedProjectsCount >= 10) {
      severity = "ENTERPRISE_CRITICAL_RISK";
      blast = 95;
    } else if (affectedProjectsCount >= 3) {
      severity = "SYSTEMIC_RISK";
      blast = 70;
    } else if (affectedProjectsCount >= 2) {
      severity = "CROSS_PROJECT_RISK";
      blast = 45;
    }

    return {
      riskId: `sys_risk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      severity,
      affectedProjects: Array.from({ length: affectedProjectsCount }, (_, i) => `proj_${i + 1}`),
      vulnerableComponent: component,
      blastRadiusScore: blast,
      recommendedMitigation: `Coordinate phased dependency patching of ${component} across all ${affectedProjectsCount} project(s).`,
      supportingEvidenceIds: evidence,
      detectedAt: new Date().toISOString(),
    };
  }
}
