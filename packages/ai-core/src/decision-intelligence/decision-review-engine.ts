/**
 * DecisionReviewEngine
 *
 * Coordinates multi-role structured review, accountability, and authorization workflows.
 */

export interface DecisionReviewRecord {
  decisionId: string;
  projectId: string;
  title: string;
  stage: "PROPOSED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXECUTING" | "COMPLETED" | "EVALUATING" | "CLOSED";
  authorId: string;
  reviewerId?: string;
  authorizationHash?: string;
  createdAt: string;
}

export class DecisionReviewEngine {
  private static reviews: Map<string, DecisionReviewRecord> = new Map();

  public static proposeDecision(decisionId: string, projectId: string, title: string, authorId: string): DecisionReviewRecord {
    const record: DecisionReviewRecord = {
      decisionId,
      projectId,
      title,
      stage: "PROPOSED",
      authorId,
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(decisionId, record);
    return record;
  }

  public static approveDecision(decisionId: string, reviewerId: string, authHash: string): DecisionReviewRecord {
    const existing = this.reviews.get(decisionId);
    if (!existing) throw new Error(`Decision "${decisionId}" not found for approval.`);

    const updated: DecisionReviewRecord = {
      ...existing,
      stage: "APPROVED",
      reviewerId,
      authorizationHash: authHash,
    };
    this.reviews.set(decisionId, updated);
    return updated;
  }

  public static getReviews(): DecisionReviewRecord[] {
    return Array.from(this.reviews.values());
  }

  public static reset(): void {
    this.reviews.clear();
  }
}
