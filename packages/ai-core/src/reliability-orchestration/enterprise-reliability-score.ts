/**
 * EnterpriseReliabilityScoreEngine
 *
 * Calculates multidimensional enterprise reliability, business continuity, and recovery compliance scores.
 */

export interface EnterpriseReliabilityScoreReport {
  projectId: string;
  overallScore: number; // 0 - 100
  technicalReliabilityScore: number;
  businessContinuityScore: number;
  recoveryReadinessScore: number;
  predictionAccuracyScore: number;
  rtoComplianceScore: number;
  status: "OPTIMIZED" | "ACCEPTABLE" | "AT_RISK";
  lastVerifiedAt: string;
}

export class EnterpriseReliabilityScoreEngine {
  public static calculateScore(params: {
    projectId: string;
    technicalReliability: number;
    businessContinuity: number;
    recoveryReadiness: number;
    predictionAccuracy: number;
    rtoCompliance: number;
  }): EnterpriseReliabilityScoreReport {
    const overall =
      params.technicalReliability * 0.25 +
      params.businessContinuity * 0.25 +
      params.recoveryReadiness * 0.2 +
      params.predictionAccuracy * 0.15 +
      params.rtoCompliance * 0.15;

    const rounded = Math.round(overall);
    const status = rounded >= 85 ? "OPTIMIZED" : rounded >= 65 ? "ACCEPTABLE" : "AT_RISK";

    return {
      projectId: params.projectId,
      overallScore: rounded,
      technicalReliabilityScore: params.technicalReliability,
      businessContinuityScore: params.businessContinuity,
      recoveryReadinessScore: params.recoveryReadiness,
      predictionAccuracyScore: params.predictionAccuracy,
      rtoComplianceScore: params.rtoCompliance,
      status,
      lastVerifiedAt: new Date().toISOString(),
    };
  }
}
