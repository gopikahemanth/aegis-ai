/**
 * KnowledgeConflictEngine
 *
 * Detects contradictory or context-divergent institutional knowledge across projects and teams.
 * Hard Invariant: CONFLICT != AUTOMATIC RESOLUTION. Human review must not be bypassed.
 */

export type KnowledgeConflictType =
  | "NO_CONFLICT"
  | "CONTEXTUAL_CONFLICT"
  | "TEMPORAL_CONFLICT"
  | "EVIDENCE_CONFLICT"
  | "DIRECT_CONTRADICTION";

export interface KnowledgeConflictReport {
  conflictId: string;
  knowledgeIdA: string;
  knowledgeIdB: string;
  conflictType: KnowledgeConflictType;
  description: string;
  requiresHumanReview: boolean;
  detectedAt: string;
}

export class KnowledgeConflictEngine {
  public static detectConflict(
    knowledgeIdA: string,
    knowledgeAStatement: string,
    knowledgeIdB: string,
    knowledgeBStatement: string
  ): KnowledgeConflictReport {
    let conflictType: KnowledgeConflictType = "NO_CONFLICT";
    let desc = "No contradiction detected between knowledge claims.";
    let requiresReview = false;

    const aLower = knowledgeAStatement.toLowerCase();
    const bLower = knowledgeBStatement.toLowerCase();

    if (
      (aLower.includes("improved latency") && bLower.includes("increased latency")) ||
      (aLower.includes("enable") && bLower.includes("disable"))
    ) {
      conflictType = "DIRECT_CONTRADICTION";
      desc = `Contradictory findings: Claim A (${knowledgeAStatement}) contradicts Claim B (${knowledgeBStatement}).`;
      requiresReview = true;
    } else if (aLower.includes("cache") && bLower.includes("cache")) {
      conflictType = "CONTEXTUAL_CONFLICT";
      desc = "Contextual divergence observed under differing workload profiles.";
      requiresReview = true;
    }

    return {
      conflictId: `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      knowledgeIdA,
      knowledgeIdB,
      conflictType,
      description: desc,
      requiresHumanReview: requiresReview,
      detectedAt: new Date().toISOString(),
    };
  }
}
