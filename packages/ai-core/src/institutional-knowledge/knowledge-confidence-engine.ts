/**
 * KnowledgeConfidenceEngine
 *
 * Evaluates the empirical confidence of institutional knowledge based on evidence strength,
 * recurrence frequency, human validations, and contradictory evidence checks.
 * Hard Invariant: HIGH_CONFIDENCE != AUTHORIZED.
 */

export type KnowledgeConfidenceLevel = "UNKNOWN" | "LOW" | "MODERATE" | "HIGH" | "VERIFIED";

export interface KnowledgeConfidenceReport {
  knowledgeId: string;
  confidenceLevel: KnowledgeConfidenceLevel;
  confidenceScorePct: number;
  factors: {
    evidenceCount: number;
    recurrenceCount: number;
    hasHumanValidation: boolean;
    hasContradictions: boolean;
  };
  summary: string;
}

export class KnowledgeConfidenceEngine {
  public static evaluateConfidence(
    knowledgeId: string,
    evidenceCount: number,
    recurrenceCount: number,
    hasHumanValidation: boolean,
    hasContradictions: boolean
  ): KnowledgeConfidenceReport {
    let score = 30;
    if (evidenceCount > 0) score += 30;
    if (recurrenceCount >= 2) score += 20;
    if (hasHumanValidation) score += 20;
    if (hasContradictions) score -= 40;

    score = Math.max(0, Math.min(100, score));

    let level: KnowledgeConfidenceLevel = "UNKNOWN";
    if (score >= 90 && hasHumanValidation && evidenceCount > 0) level = "VERIFIED";
    else if (score >= 70) level = "HIGH";
    else if (score >= 50) level = "MODERATE";
    else if (score >= 20) level = "LOW";

    return {
      knowledgeId,
      confidenceLevel: level,
      confidenceScorePct: score,
      factors: {
        evidenceCount,
        recurrenceCount,
        hasHumanValidation,
        hasContradictions,
      },
      summary: `Knowledge ${knowledgeId} confidence evaluated as ${level} (${score}% empirical support).`,
    };
  }
}
