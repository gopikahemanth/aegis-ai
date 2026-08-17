/**
 * KnowledgeActionDecisionEngine
 *
 * Formulates governed action decisions correlating insights, eligibility, and risk.
 * Hard Invariant: INTELLIGENCE != DECISION != AUTHORIZATION != EXECUTION. Never executes actions directly.
 */

export type ActionDecisionOutcome =
  | "OBSERVE"
  | "INVESTIGATE"
  | "REVALIDATE"
  | "RECOMMEND"
  | "SIMULATE"
  | "REQUEST_REVIEW"
  | "REQUEST_AUTHORIZATION"
  | "NO_ACTION";

export interface KnowledgeActionDecisionReport {
  decisionId: string;
  actionId: string;
  recommendedDecision: ActionDecisionOutcome;
  rationale: string;
  requiresHumanReview: boolean;
  confidenceScore: number;
  generatedAt: string;
}

export class KnowledgeActionDecisionEngine {
  public static evaluateDecision(
    actionId: string,
    isEligible: boolean,
    hasContradictions: boolean,
    confidenceScore: number,
    risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  ): KnowledgeActionDecisionReport {
    let dec: ActionDecisionOutcome = "OBSERVE";
    let rationale = "Monitoring baseline telemetry.";

    if (!isEligible) {
      dec = "NO_ACTION";
      rationale = "Action blocked by governance boundaries.";
    } else if (hasContradictions) {
      dec = "REVALIDATE";
      rationale = "Contradictory evidence detected; revalidation required.";
    } else if (risk === "CRITICAL" || risk === "HIGH") {
      dec = "REQUEST_REVIEW";
      rationale = "High-risk action proposal requires senior architecture review.";
    } else if (confidenceScore >= 0.9) {
      dec = "REQUEST_AUTHORIZATION";
      rationale = "High-confidence validated insight ready for formal authorization.";
    } else {
      dec = "SIMULATE";
      rationale = "Zero-mutation simulation advised before formal request.";
    }

    return {
      decisionId: `kdec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actionId,
      recommendedDecision: dec,
      rationale,
      requiresHumanReview: (dec as ActionDecisionOutcome) !== "NO_ACTION" && (dec as ActionDecisionOutcome) !== "OBSERVE",

      confidenceScore,
      generatedAt: new Date().toISOString(),
    };
  }
}
