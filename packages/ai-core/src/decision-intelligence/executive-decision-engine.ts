/**
 * ExecutiveDecisionEngine
 *
 * Formulates evidence-backed executive recommendations.
 * Hard Invariant: DECISION INTELLIGENCE != DECISION AUTHORIZATION != DECISION EXECUTION.
 */

export interface ExecutiveRecommendation {
  recommendationId: string;
  projectId: string;
  action: "ACCELERATE" | "CONTINUE" | "DEPRIORITIZE" | "REPLAN" | "INVESTIGATE" | "SIMULATE" | "REQUEST_AUTHORIZATION" | "NO_ACTION";
  reasoning: string;
  supportingEvidenceIds: string[];
  riskSeverity: "LOW" | "MODERATE" | "HIGH";
  confidenceScore: number;
  authorizationRequired: boolean;
}

export class ExecutiveDecisionEngine {
  public static recommendAction(
    projectId: string,
    action: ExecutiveRecommendation["action"],
    reasoning: string,
    evidenceIds: string[]
  ): ExecutiveRecommendation {
    const requiresAuth =
      action === "REQUEST_AUTHORIZATION" ||
      action === "ACCELERATE" ||
      action === "DEPRIORITIZE" ||
      action === "REPLAN";

    return {
      recommendationId: `exec_rec_${Date.now()}`,
      projectId,
      action,
      reasoning,
      supportingEvidenceIds: evidenceIds,
      riskSeverity: "LOW",
      confidenceScore: 0.97,
      authorizationRequired: requiresAuth,
    };
  }
}
