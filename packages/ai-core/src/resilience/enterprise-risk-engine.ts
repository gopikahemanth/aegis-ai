/**
 * EnterpriseRiskEngine
 *
 * Correlates production telemetry, SLOs, and incidents into structured risk profiles.
 * Hard Invariant: RISK FORECAST != DETECTED INCIDENT != VERIFIED FAILURE.
 */

export type RiskClassification =
  | "PREDICTED"
  | "ESTIMATED"
  | "OBSERVED"
  | "DETECTED"
  | "VERIFIED"
  | "MITIGATED"
  | "RESOLVED"
  | "INSUFFICIENT_EVIDENCE";

export type RiskCategory =
  | "SECURITY"
  | "RELIABILITY"
  | "AVAILABILITY"
  | "DEPENDENCY"
  | "INFRASTRUCTURE"
  | "DATABASE"
  | "COMPLIANCE"
  | "CROSS_PROJECT";

export interface EnterpriseRiskRecord {
  riskId: string;
  organizationId: string;
  projectId: string;
  category: RiskCategory;
  severity: "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  probabilityScore: number; // 0 - 100
  impactScore: number; // 0 - 100
  classification: RiskClassification;
  affectedProjects: string[];
  mitigationRecommendation: string;
  timestamp: string;
}

export class ResilienceRiskEngine {
  private static risks: EnterpriseRiskRecord[] = [];


  public static registerRisk(risk: Omit<EnterpriseRiskRecord, "riskId" | "timestamp">): EnterpriseRiskRecord {
    const full: EnterpriseRiskRecord = {
      ...risk,
      riskId: `risk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.risks.push(full);
    return full;
  }

  public static getRisks(organizationId?: string): EnterpriseRiskRecord[] {
    if (organizationId) {
      return this.risks.filter((r) => r.organizationId === organizationId);
    }
    return [...this.risks];
  }

  public static reset(): void {
    this.risks = [];
  }
}
