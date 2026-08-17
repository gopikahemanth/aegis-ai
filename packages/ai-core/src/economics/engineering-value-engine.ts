/**
 * EngineeringValueEngine
 *
 * Maps engineering initiatives to measurable business value.
 * Hard Invariant: DEPLOYMENT SUCCESS != VALUE REALIZATION.
 */

export type ValueClassification =
  | "UNKNOWN"
  | "FORECAST"
  | "ESTIMATED"
  | "OBSERVED"
  | "VERIFIED"
  | "REALIZED"
  | "REGRESSED"
  | "INSUFFICIENT_EVIDENCE";

export interface ValueAssessment {
  initiativeId: string;
  projectId: string;
  expectedValueINR: number;
  realizedValueINR: number;
  realizationPercentage: number;
  classification: ValueClassification;
  evidenceSummary: string;
}

export class EngineeringValueEngine {
  public static assessValue(
    initiativeId: string,
    projectId: string,
    expectedValue: number,
    verifiedOutcomeAchievement: number,
    evidencePresent: boolean
  ): ValueAssessment {
    if (!evidencePresent) {
      return {
        initiativeId,
        projectId,
        expectedValueINR: expectedValue,
        realizedValueINR: 0,
        realizationPercentage: 0,
        classification: "INSUFFICIENT_EVIDENCE",
        evidenceSummary: "No verified runtime outcome telemetry available.",
      };
    }

    const realized = (expectedValue * Math.min(100, Math.max(0, verifiedOutcomeAchievement))) / 100;
    const realizationPercentage = Math.round((realized / (expectedValue || 1)) * 100);

    let classification: ValueClassification = "REALIZED";
    if (realizationPercentage < 50) classification = "OBSERVED";
    else if (realizationPercentage >= 90) classification = "REALIZED";
    else classification = "VERIFIED";

    return {
      initiativeId,
      projectId,
      expectedValueINR: expectedValue,
      realizedValueINR: Math.round(realized),
      realizationPercentage,
      classification,
      evidenceSummary: `Verified outcome telemetry at ${verifiedOutcomeAchievement}% achievement yields ₹${Math.round(realized)} realized value.`,
    };
  }
}
