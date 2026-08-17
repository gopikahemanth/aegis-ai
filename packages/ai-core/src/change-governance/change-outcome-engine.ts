/**
 * ChangeOutcomeEngine
 *
 * Evaluates outcome realization for enterprise changes with complete attribution.
 */

export interface ChangeOutcomeReport {
  changeId: string;
  projectId: string;
  expectedKpiDelta: number;
  observedKpiDelta: number;
  classification:
    | "EXPECTED_SUCCESS"
    | "PARTIAL_SUCCESS"
    | "NO_EFFECT"
    | "NEGATIVE_EFFECT"
    | "REGRESSION"
    | "UNEXPECTED_POSITIVE"
    | "UNEXPECTED_NEGATIVE"
    | "INSUFFICIENT_EVIDENCE";
  valueAttributionINR: number;
  summary: string;
}

export class ChangeOutcomeEngine {
  public static evaluateOutcome(
    changeId: string,
    projectId: string,
    expectedDelta: number,
    observedDelta: number,
    valueINR: number
  ): ChangeOutcomeReport {
    let classification: ChangeOutcomeReport["classification"] = "EXPECTED_SUCCESS";

    if (observedDelta < 0) {
      classification = "REGRESSION";
    } else if (observedDelta === 0) {
      classification = "NO_EFFECT";
    } else if (observedDelta > expectedDelta * 1.5) {
      classification = "UNEXPECTED_POSITIVE";
    } else if (observedDelta < expectedDelta * 0.7) {
      classification = "PARTIAL_SUCCESS";
    }

    return {
      changeId,
      projectId,
      expectedKpiDelta: expectedDelta,
      observedKpiDelta: observedDelta,
      classification,
      valueAttributionINR: valueINR,
      summary: `Change outcome classified as ${classification} (Observed: +${observedDelta}%, Value: ₹${valueINR.toLocaleString()}).`,
    };
  }
}
