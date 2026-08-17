/**
 * EvolutionOutcomeEngine
 *
 * Measures realized benefits, ROI, and KPI improvements resulting from system evolutions.
 */

export type EvolutionOutcomeClassification =
  | "IMPROVEMENT_REALIZED"
  | "PARTIAL_IMPROVEMENT"
  | "NO_IMPROVEMENT"
  | "NEGATIVE_IMPACT"
  | "REGRESSION"
  | "UNEXPECTED_IMPROVEMENT"
  | "UNEXPECTED_REGRESSION"
  | "INSUFFICIENT_EVIDENCE";

export interface EvolutionOutcomeReport {
  opportunityId: string;
  projectId: string;
  expectedReliabilityGain: number;
  actualReliabilityGain: number;
  expectedValueINR: number;
  actualValueINR: number;
  realizedRoi: number;
  classification: EvolutionOutcomeClassification;
  summary: string;
}

export class EvolutionOutcomeEngine {
  public static evaluateOutcome(
    opportunityId: string,
    projectId: string,
    expectedGain: number,
    actualGain: number,
    expectedValueINR: number,
    actualValueINR: number,
    costINR: number
  ): EvolutionOutcomeReport {
    let classification: EvolutionOutcomeClassification = "IMPROVEMENT_REALIZED";

    if (actualGain < 0) {
      classification = "REGRESSION";
    } else if (actualGain === 0) {
      classification = "NO_IMPROVEMENT";
    } else if (actualGain > expectedGain * 1.5) {
      classification = "UNEXPECTED_IMPROVEMENT";
    } else if (actualGain < expectedGain * 0.7) {
      classification = "PARTIAL_IMPROVEMENT";
    }

    const roi = costINR > 0 ? Number((actualValueINR / costINR).toFixed(2)) : 5;

    return {
      opportunityId,
      projectId,
      expectedReliabilityGain: expectedGain,
      actualReliabilityGain: actualGain,
      expectedValueINR,
      actualValueINR,
      realizedRoi: roi,
      classification,
      summary: `System evolution outcome classified as ${classification} (Realized ROI: ${roi}x, Value: ₹${actualValueINR.toLocaleString()}).`,
    };
  }
}
