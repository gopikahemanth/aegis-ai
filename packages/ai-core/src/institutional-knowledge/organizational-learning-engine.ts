/**
 * OrganizationalLearningEngine
 *
 * Derives actionable, governed organizational improvement recommendations from verified institutional memory.
 * Hard Invariant: KNOWLEDGE -> RECOMMENDATION != AUTOMATIC AUTHORIZATION.
 */

export interface OrganizationalLearningRecommendation {
  recommendationId: string;
  organizationId: string;
  title: string;
  category:
    | "ENGINEERING_STANDARD"
    | "RUNBOOK_UPDATE"
    | "DEPLOYMENT_CHECKLIST"
    | "ARCHITECTURE_GUIDELINE"
    | "RECOVERY_DRILL"
    | "SECURITY_CONTROL";
  rationale: string;
  sourceKnowledgeIds: string[];
  requiresHumanReview: boolean;
  createdAt: string;
}

export class OrganizationalLearningEngine {
  public static generateRecommendation(
    organizationId: string,
    title: string,
    category: OrganizationalLearningRecommendation["category"],
    rationale: string,
    sourceKnowledgeIds: string[]
  ): OrganizationalLearningRecommendation {
    return {
      recommendationId: `rec_learn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId,
      title,
      category,
      rationale,
      sourceKnowledgeIds,
      requiresHumanReview: true,
      createdAt: new Date().toISOString(),
    };
  }
}

export { OrganizationalLearningEngine as KnowledgeLearningEngine, OrganizationalLearningEngine as InstitutionalKnowledgeLearningEngine };

