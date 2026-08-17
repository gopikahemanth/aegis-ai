/**
 * KnowledgeFreshnessEngine
 *
 * Detects knowledge decay, stale evidence, and contradictions against newer telemetry.
 * Hard Invariant: OLD KNOWLEDGE != CURRENT TRUTH. Expired knowledge is never authoritative.
 */

export type KnowledgeDecayState =
  | "FRESH"
  | "AGING"
  | "STALE"
  | "EXPIRED"
  | "CONTRADICTED"
  | "REQUIRES_REVALIDATION";

export interface KnowledgeFreshnessReport {
  insightId: string;
  state: KnowledgeDecayState;
  ageDays: number;
  isAuthoritative: boolean;
  hasNewerContradictoryEvidence: boolean;
  recommendedAction: "KEEP" | "REVALIDATE" | "DEPRECATE" | "RETIRE";
  summary: string;
}

export class KnowledgeFreshnessEngine {
  public static evaluateFreshness(
    insightId: string,
    ageDays: number,
    hasContradictions: boolean = false
  ): KnowledgeFreshnessReport {
    let state: KnowledgeDecayState = "FRESH";
    let isAuthoritative = true;
    let recAction: KnowledgeFreshnessReport["recommendedAction"] = "KEEP";

    if (hasContradictions) {
      state = "CONTRADICTED";
      isAuthoritative = false;
      recAction = "REVALIDATE";
    } else if (ageDays > 180) {
      state = "EXPIRED";
      isAuthoritative = false;
      recAction = "RETIRE";
    } else if (ageDays > 90) {
      state = "STALE";
      isAuthoritative = false;
      recAction = "REVALIDATE";
    } else if (ageDays > 30) {
      state = "AGING";
      recAction = "KEEP";
    }

    return {
      insightId,
      state,
      ageDays,
      isAuthoritative,
      hasNewerContradictoryEvidence: hasContradictions,
      recommendedAction: recAction,
      summary: `Knowledge ${insightId} is ${state} (${ageDays} days old). Authoritative: ${isAuthoritative}.`,
    };
  }
}
