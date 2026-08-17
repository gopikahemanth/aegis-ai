/**
 * PredictiveResilienceScoreEngine
 *
 * Calculates multidimensional predictive resilience scores across failure lead time,
 * recovery readiness, and intervention effectiveness.
 */

export interface PredictiveResilienceScoreReport {
  projectId: string;
  overallScore: number; // 0 - 100
  predictionAccuracyScore: number;
  recoveryReadinessScore: number;
  leadTimeScore: number;
  failoverReadinessScore: number;
  status: "PREDICTIVE_RESILIENT" | "ACCEPTABLE" | "AT_RISK";
  lastVerifiedAt: string;
}

export class PredictiveResilienceScoreEngine {
  public static calculateScore(params: {
    projectId: string;
    predictionAccuracy: number;
    recoveryReadiness: number;
    leadTime: number;
    failoverReadiness: number;
  }): PredictiveResilienceScoreReport {
    const overall =
      params.predictionAccuracy * 0.3 +
      params.recoveryReadiness * 0.3 +
      params.leadTime * 0.2 +
      params.failoverReadiness * 0.2;

    const rounded = Math.round(overall);
    const status = rounded >= 85 ? "PREDICTIVE_RESILIENT" : rounded >= 65 ? "ACCEPTABLE" : "AT_RISK";

    return {
      projectId: params.projectId,
      overallScore: rounded,
      predictionAccuracyScore: params.predictionAccuracy,
      recoveryReadinessScore: params.recoveryReadiness,
      leadTimeScore: params.leadTime,
      failoverReadinessScore: params.failoverReadiness,
      status,
      lastVerifiedAt: new Date().toISOString(),
    };
  }
}
