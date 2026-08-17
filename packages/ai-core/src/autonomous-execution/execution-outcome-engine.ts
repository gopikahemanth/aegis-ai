/**
 * ExecutionOutcomeEngine
 *
 * Reconciles expected vs observed effect and evaluates true business outcome realization.
 */

export interface OutcomeReconciliationReport {
  executionId: string;
  projectId: string;
  expectedKpiDeltaPercentage: number;
  observedKpiDeltaPercentage: number;
  classification:
    | "SUCCESS"
    | "PARTIAL_SUCCESS"
    | "NO_EFFECT"
    | "NEGATIVE_EFFECT"
    | "REGRESSION"
    | "INSUFFICIENT_EVIDENCE";
  roiRealizedINR: number;
  summary: string;
}

export class ExecutionOutcomeEngine {
  public static reconcileOutcome(
    executionId: string,
    projectId: string,
    expectedDelta: number,
    observedDelta: number,
    roiINR: number
  ): OutcomeReconciliationReport {
    let classification: OutcomeReconciliationReport["classification"] = "SUCCESS";

    if (observedDelta < 0) {
      classification = "REGRESSION";
    } else if (observedDelta === 0) {
      classification = "NO_EFFECT";
    } else if (observedDelta < expectedDelta * 0.7) {
      classification = "PARTIAL_SUCCESS";
    }

    return {
      executionId,
      projectId,
      expectedKpiDeltaPercentage: expectedDelta,
      observedKpiDeltaPercentage: observedDelta,
      classification,
      roiRealizedINR: roiINR,
      summary: `Execution outcome evaluated as ${classification} (Observed: +${observedDelta}%, Expected: +${expectedDelta}%).`,
    };
  }
}
