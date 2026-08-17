/**
 * KnowledgeReuseEngine
 *
 * Measures the empirical reuse, engineering time saved, and outcome improvements driven by institutional memory.
 */

export interface KnowledgeReuseMetricsReport {
  organizationId: string;
  totalRetrievalsCount: number;
  acceptedRecommendationsCount: number;
  reusedHistoricalSolutionsCount: number;
  estimatedEngineeringHoursSaved: number;
  reuseRatePct: number;
  effectivenessScore: number; // 0 to 1
  summary: string;
}

export class KnowledgeReuseEngine {
  public static calculateReuseMetrics(
    organizationId: string,
    retrievals: number,
    accepted: number,
    solutionsReused: number,
    hoursSaved: number
  ): KnowledgeReuseMetricsReport {
    const reuseRate = retrievals > 0 ? Math.round((accepted / retrievals) * 100) : 0;
    const effectiveness = retrievals > 0 ? Math.min(1.0, (accepted + solutionsReused) / (retrievals * 1.5)) : 0.8;

    return {
      organizationId,
      totalRetrievalsCount: retrievals,
      acceptedRecommendationsCount: accepted,
      reusedHistoricalSolutionsCount: solutionsReused,
      estimatedEngineeringHoursSaved: hoursSaved,
      reuseRatePct: reuseRate,
      effectivenessScore: parseFloat(effectiveness.toFixed(2)),
      summary: `Knowledge reuse rate evaluated at ${reuseRate}% (${hoursSaved} hours saved across engineering teams).`,
    };
  }
}
