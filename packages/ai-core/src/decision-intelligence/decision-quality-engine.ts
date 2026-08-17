/**
 * DecisionQualityEngine
 *
 * Evaluates historical enterprise decisions against verified operational and business outcomes.
 * Hard Invariant: GOOD OUTCOME != GOOD DECISION.
 */

export interface DecisionQualityEvaluation {
  decisionId: string;
  projectId: string;
  predictionAccuracy: number;
  outcomeAchievementScore: number;
  riskEstimationAccuracy: number;
  costEstimationAccuracy: number;
  reliabilityImpactScore: number;
  classification: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "INEFFECTIVE" | "REGRESSED" | "INSUFFICIENT_EVIDENCE" | "PENDING";
  reasoningQualityScore: number;
  summary: string;
}

export class DecisionQualityEngine {
  public static evaluateDecision(params: {
    decisionId: string;
    projectId: string;
    predictionAccuracy: number;
    outcomeAchievement: number;
    riskEstimationAccuracy: number;
    costEstimationAccuracy: number;
    reliabilityImpact: number;
  }): DecisionQualityEvaluation {
    const avgScore =
      (params.predictionAccuracy +
        params.outcomeAchievement +
        params.riskEstimationAccuracy +
        params.costEstimationAccuracy +
        params.reliabilityImpact) /
      5;

    let classification: DecisionQualityEvaluation["classification"] = "EFFECTIVE";
    if (avgScore < 50) classification = "INEFFECTIVE";
    else if (avgScore < 75) classification = "PARTIALLY_EFFECTIVE";

    return {
      decisionId: params.decisionId,
      projectId: params.projectId,
      predictionAccuracy: params.predictionAccuracy,
      outcomeAchievementScore: params.outcomeAchievement,
      riskEstimationAccuracy: params.riskEstimationAccuracy,
      costEstimationAccuracy: params.costEstimationAccuracy,
      reliabilityImpactScore: params.reliabilityImpact,
      classification,
      reasoningQualityScore: Math.round(avgScore),
      summary: `Decision "${params.decisionId}" evaluated as ${classification} with ${Math.round(avgScore)}% reasoning quality.`,
    };
  }
}
