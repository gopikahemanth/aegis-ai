/**
 * ContinuityScoreEngine
 *
 * Calculates multidimensional business continuity and recovery compliance scores.
 */

export interface ContinuityScoreReport {
  projectId: string;
  overallScore: number; // 0 - 100
  recoveryReadinessScore: number;
  rtoComplianceScore: number;
  rpoComplianceScore: number;
  backupReliabilityScore: number;
  redundancySufficiencyScore: number;
  status: "OPTIMIZED" | "ACCEPTABLE" | "NEEDS_IMPROVEMENT";
  lastVerifiedAt: string;
}

export class ContinuityScoreEngine {
  public static calculateScore(params: {
    projectId: string;
    recoveryReadiness: number;
    rtoCompliance: number;
    rpoCompliance: number;
    backupReliability: number;
    redundancySufficiency: number;
  }): ContinuityScoreReport {
    const overall =
      params.recoveryReadiness * 0.25 +
      params.rtoCompliance * 0.25 +
      params.rpoCompliance * 0.2 +
      params.backupReliability * 0.15 +
      params.redundancySufficiency * 0.15;

    const rounded = Math.round(overall);
    const status = rounded >= 85 ? "OPTIMIZED" : rounded >= 65 ? "ACCEPTABLE" : "NEEDS_IMPROVEMENT";

    return {
      projectId: params.projectId,
      overallScore: rounded,
      recoveryReadinessScore: params.recoveryReadiness,
      rtoComplianceScore: params.rtoCompliance,
      rpoComplianceScore: params.rpoCompliance,
      backupReliabilityScore: params.backupReliability,
      redundancySufficiencyScore: params.redundancySufficiency,
      status,
      lastVerifiedAt: new Date().toISOString(),
    };
  }
}
