/**
 * ResilienceScoreEngine
 *
 * Computes evidence-backed resilience and disaster-readiness scores across infrastructure dimensions.
 */

export interface ResilienceScoreReport {
  projectId: string;
  overallScore: number; // 0 - 100
  availabilityScore: number;
  recoverabilityScore: number;
  backupReadinessScore: number;
  dependencyIsolationScore: number;
  status: "RESILIENT" | "ACCEPTABLE" | "AT_RISK";
  lastVerifiedAt: string;
}

export class ResilienceScoreEngine {
  public static computeResilience(
    projectId: string,
    availability: number,
    recoverability: number,
    backupReadiness: number,
    dependencyIsolation: number
  ): ResilienceScoreReport {
    const overall =
      availability * 0.35 +
      recoverability * 0.25 +
      backupReadiness * 0.2 +
      dependencyIsolation * 0.2;

    const rounded = Math.round(overall);
    const status = rounded >= 85 ? "RESILIENT" : rounded >= 65 ? "ACCEPTABLE" : "AT_RISK";

    return {
      projectId,
      overallScore: rounded,
      availabilityScore: availability,
      recoverabilityScore: recoverability,
      backupReadinessScore: backupReadiness,
      dependencyIsolationScore: dependencyIsolation,
      status,
      lastVerifiedAt: new Date().toISOString(),
    };
  }
}
