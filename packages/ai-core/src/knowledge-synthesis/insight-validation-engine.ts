/**
 * InsightValidationEngine
 *
 * Validates enterprise insights against multi-source evidence, historical memory, and conflicting signals.
 * Hard Invariant: Never automatically upgrades insight to VERIFIED without formal verification evidence.
 */

export type InsightValidationStatus =
  | "UNVALIDATED"
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CONTRADICTED"
  | "VERIFIED"
  | "REJECTED";

export interface InsightValidationReport {
  insightId: string;
  status: InsightValidationStatus;
  evidenceStrengthScore: number;
  hasContradictions: boolean;
  validationSummary: string;
  validatedAt: string;
}

export class InsightValidationEngine {
  public static validateInsight(
    insightId: string,
    evidenceCount: number,
    hasContradictions: boolean,
    isExperimentallyVerified: boolean = false
  ): InsightValidationReport {
    let status: InsightValidationStatus = "UNVALIDATED";
    let score = 50;

    if (hasContradictions) {
      status = "CONTRADICTED";
      score = 30;
    } else if (isExperimentallyVerified && evidenceCount >= 2) {
      status = "VERIFIED";
      score = 98;
    } else if (evidenceCount >= 3) {
      status = "SUPPORTED";
      score = 88;
    } else if (evidenceCount >= 1) {
      status = "PARTIALLY_SUPPORTED";
      score = 70;
    }

    return {
      insightId,
      status,
      evidenceStrengthScore: score,
      hasContradictions,
      validationSummary: `Insight ${insightId} validated with status ${status} (${evidenceCount} supporting evidence source(s)).`,
      validatedAt: new Date().toISOString(),
    };
  }
}
