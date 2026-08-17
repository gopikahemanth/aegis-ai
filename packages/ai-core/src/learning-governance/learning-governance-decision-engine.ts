/**
 * LearningGovernanceDecisionEngine
 *
 * Formulates governed decisions correlating lessons, contradictions, and effectiveness.
 * Hard Invariant: INTELLIGENCE != DECISION != AUTHORIZATION != EXECUTION.
 */

export type LearningGovernanceDecisionOutcome =
  | "OBSERVE"
  | "INVESTIGATE"
  | "REVALIDATE"
  | "RECOMMEND"
  | "SIMULATE"
  | "REQUEST_AUTHORIZATION"
  | "NO_ACTION";

export interface LearningGovernanceDecisionReport {
  decisionId: string;
  recommendedDecision: LearningGovernanceDecisionOutcome;
  rationale: string;
  requiresHumanReview: boolean;
  confidenceScore: number;
  generatedAt: string;
}

export class LearningGovernanceDecisionEngine {
  public static evaluateDecision(
    hasContradiction: boolean,
    isStale: boolean,
    confidenceScore: number
  ): LearningGovernanceDecisionReport {
    let dec: LearningGovernanceDecisionOutcome = "OBSERVE";
    let rationale = "Monitoring institutional learning health.";

    if (hasContradiction) {
      dec = "INVESTIGATE";
      rationale = "Contradiction detected in active lessons; multi-role architectural investigation required.";
    } else if (isStale) {
      dec = "REVALIDATE";
      rationale = "Knowledge or lesson exceeds validity window; revalidation against current telemetry required.";
    } else if (confidenceScore >= 0.9) {
      dec = "RECOMMEND";
      rationale = "High-confidence verified lesson ready for proactive enterprise recommendation.";
    }

    return {
      decisionId: `lgdec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recommendedDecision: dec,
      rationale,
      requiresHumanReview: (dec as LearningGovernanceDecisionOutcome) !== "NO_ACTION" && (dec as LearningGovernanceDecisionOutcome) !== "OBSERVE",
      confidenceScore,
      generatedAt: new Date().toISOString(),
    };
  }
}
