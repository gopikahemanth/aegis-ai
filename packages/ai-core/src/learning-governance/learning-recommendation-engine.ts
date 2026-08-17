/**
 * LearningRecommendationEngine
 *
 * Generates governed recommendations for institutional lesson reuse, revalidation, and retirement.
 * Hard Invariant: LEARNING RECOMMENDATION != AUTHORIZATION.
 */

export type LearningRecommendationType =
  | "REUSE_LESSON"
  | "REVALIDATE_KNOWLEDGE"
  | "REVIEW_CONTRADICTION"
  | "REDUCE_CONFIDENCE"
  | "RETIRE_KNOWLEDGE"
  | "COLLECT_MORE_EVIDENCE"
  | "RUN_VALIDATION"
  | "REQUEST_HUMAN_REVIEW"
  | "NO_ACTION";

export interface LearningRecommendationReport {
  recommendationId: string;
  type: LearningRecommendationType;
  targetId: string;
  rationale: string;
  confidence: number;
  evidenceIds: string[];
  affectedScope: string[];
  authorizationRequirement: "AUTO_SAFE" | "REQUIRES_AUTHORIZATION" | "REQUIRES_MULTI_ROLE_REVIEW";
  createdAt: string;
}

export class LearningRecommendationEngine {
  public static recommend(
    type: LearningRecommendationType,
    targetId: string,
    rationale: string,
    evidenceIds: string[],
    scope: string[],
    confidence: number = 0.95
  ): LearningRecommendationReport {
    let authReq: LearningRecommendationReport["authorizationRequirement"] = "REQUIRES_AUTHORIZATION";
    if (type === "REUSE_LESSON" && scope.length <= 1) {
      authReq = "AUTO_SAFE";
    } else if (type === "REVIEW_CONTRADICTION" || type === "RETIRE_KNOWLEDGE") {
      authReq = "REQUIRES_MULTI_ROLE_REVIEW";
    }

    return {
      recommendationId: `lrec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      targetId,
      rationale,
      confidence,
      evidenceIds,
      affectedScope: scope,
      authorizationRequirement: authReq,
      createdAt: new Date().toISOString(),
    };
  }
}
