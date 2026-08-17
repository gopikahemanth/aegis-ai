/**
 * KnowledgeGapEngine
 *
 * Identifies areas where the organization lacks historical experience or verified evidence.
 * Hard Invariant: Prefers admitting uncertainty over fabricating knowledge.
 */

export type KnowledgeGapLevel =
  | "NO_KNOWLEDGE"
  | "LIMITED_KNOWLEDGE"
  | "PARTIAL_KNOWLEDGE"
  | "SUFFICIENT_KNOWLEDGE"
  | "HIGH_CONFIDENCE_KNOWLEDGE";

export interface KnowledgeGapReport {
  domainOrTechnology: string;
  gapLevel: KnowledgeGapLevel;
  recordedExperiencesCount: number;
  recordedPatternsCount: number;
  recommendation: string;
}

export class KnowledgeGapEngine {
  public static evaluateGap(
    domainOrTech: string,
    experiencesCount: number,
    patternsCount: number
  ): KnowledgeGapReport {
    let level: KnowledgeGapLevel = "NO_KNOWLEDGE";
    let rec = "Conduct exploratory spikes and document baseline evidence before production usage.";

    if (experiencesCount >= 5 && patternsCount >= 2) {
      level = "HIGH_CONFIDENCE_KNOWLEDGE";
      rec = "Comprehensive institutional memory exists. Leverage established runbooks.";
    } else if (experiencesCount >= 2) {
      level = "SUFFICIENT_KNOWLEDGE";
      rec = "Sufficient historical knowledge exists. Follow documented patterns.";
    } else if (experiencesCount === 1) {
      level = "LIMITED_KNOWLEDGE";
      rec = "Limited historical knowledge. Require peer review for changes.";
    }

    return {
      domainOrTechnology: domainOrTech,
      gapLevel: level,
      recordedExperiencesCount: experiencesCount,
      recordedPatternsCount: patternsCount,
      recommendation: rec,
    };

  }
}
