/**
 * InsightOutcomeEngine
 *
 * Measures real-world effects of insight-driven actions, comparing expected vs observed vs verified outcomes.
 * Hard Invariant: ACTION EXECUTED != ACTION EFFECTIVE.
 */

export type OutcomeRealizationStatus =
  | "EXPECTED"
  | "PARTIALLY_REALIZED"
  | "REALIZED"
  | "UNDERPERFORMED"
  | "FAILED"
  | "REGRESSED"
  | "UNKNOWN"
  | "INSUFFICIENT_EVIDENCE";

export interface InsightOutcomeReport {
  actionId: string;
  insightId: string;
  expectedMetric: string;
  observedMetric: string;
  realizationStatus: OutcomeRealizationStatus;
  variancePct: number;
  isVerified: boolean;
  summary: string;
}

export class InsightOutcomeEngine {
  public static measureOutcome(
    actionId: string,
    insightId: string,
    expectedImprovementPct: number,
    actualImprovementPct: number,
    evidenceVerified: boolean = true
  ): InsightOutcomeReport {
    const variance = actualImprovementPct - expectedImprovementPct;
    let status: OutcomeRealizationStatus = "UNKNOWN";

    if (!evidenceVerified) {
      status = "INSUFFICIENT_EVIDENCE";
    } else if (actualImprovementPct < 0) {
      status = "REGRESSED";
    } else if (actualImprovementPct === 0) {
      status = "FAILED";
    } else if (actualImprovementPct >= expectedImprovementPct) {
      status = "REALIZED";
    } else if (actualImprovementPct >= expectedImprovementPct * 0.5) {
      status = "PARTIALLY_REALIZED";
    } else {
      status = "UNDERPERFORMED";
    }

    return {
      actionId,
      insightId,
      expectedMetric: `+${expectedImprovementPct}% expected gain`,
      observedMetric: `${actualImprovementPct >= 0 ? "+" : ""}${actualImprovementPct}% observed gain`,
      realizationStatus: status,
      variancePct: parseFloat(variance.toFixed(2)),
      isVerified: evidenceVerified,
      summary: `Action ${actionId} outcome evaluated as ${status} (variance: ${variance > 0 ? "+" : ""}${variance}%).`,
    };
  }
}
