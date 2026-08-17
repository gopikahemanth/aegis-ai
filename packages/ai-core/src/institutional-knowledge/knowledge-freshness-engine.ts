/**
 * KnowledgeFreshnessEngine
 *
 * Tracks empirical decay, staleness, and validity of institutional knowledge over time and architecture changes.
 */

export type KnowledgeFreshnessStatus =
  | "CURRENT"
  | "AGING"
  | "STALE"
  | "SUPERSEDED"
  | "REQUIRES_REVALIDATION";

export interface KnowledgeFreshnessReport {
  knowledgeId: string;
  ageDays: number;
  status: KnowledgeFreshnessStatus;
  revalidationRecommended: boolean;
  summary: string;
}

export class KnowledgeFreshnessEngine {
  public static evaluateFreshness(
    knowledgeId: string,
    ageDays: number,
    hasMajorArchitectureChanges: boolean = false
  ): KnowledgeFreshnessReport {
    let status: KnowledgeFreshnessStatus = "CURRENT";
    let revalidation = false;

    if (hasMajorArchitectureChanges) {
      status = "REQUIRES_REVALIDATION";
      revalidation = true;
    } else if (ageDays > 180) {
      status = "STALE";
      revalidation = true;
    } else if (ageDays > 60) {
      status = "AGING";
    }

    return {
      knowledgeId,
      ageDays,
      status,
      revalidationRecommended: revalidation,
      summary: `Knowledge ${knowledgeId} evaluated as ${status} (${ageDays} days old).`,
    };
  }
}
