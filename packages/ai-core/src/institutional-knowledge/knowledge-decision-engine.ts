/**
 * KnowledgeDecisionEngine
 *
 * Correlates context, evidence, freshness, and confidence into governed engineering actions.
 * Hard Invariant: KNOWLEDGE != DECISION != AUTHORIZATION != EXECUTION.
 */

export type KnowledgeActionRecommendation =
  | "OBSERVE"
  | "INVESTIGATE"
  | "RETRIEVE_KNOWLEDGE"
  | "RECOMMEND"
  | "REQUEST_REVIEW"
  | "REQUEST_AUTHORIZATION"
  | "NO_ACTION";

export interface KnowledgeDecisionReport {
  decisionId: string;
  recommendedAction: KnowledgeActionRecommendation;
  reasoning: string;
  confidenceScore: number;
  generatedAt: string;
}

export class KnowledgeDecisionEngine {
  public static formulateAction(
    hasHistoricalMatch: boolean,
    confidenceScore: number,
    hasConflict: boolean
  ): KnowledgeDecisionReport {
    let action: KnowledgeActionRecommendation = "NO_ACTION";
    let reasoning = "No historical action indicated.";

    if (hasConflict) {
      action = "REQUEST_REVIEW";
      reasoning = "Conflicting institutional knowledge detected across projects. Requires senior architect review.";
    } else if (hasHistoricalMatch && confidenceScore >= 0.85) {
      action = "RECOMMEND";
      reasoning = "High-confidence verified historical resolution matches current incident symptoms.";
    } else if (hasHistoricalMatch) {
      action = "INVESTIGATE";
      reasoning = "Moderate historical matches found. Additional diagnostics advised.";
    } else {
      action = "RETRIEVE_KNOWLEDGE";
      reasoning = "Query broad institutional memory for adjacent architecture patterns.";
    }

    return {
      decisionId: `kdec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recommendedAction: action,
      reasoning,
      confidenceScore,
      generatedAt: new Date().toISOString(),
    };
  }
}
