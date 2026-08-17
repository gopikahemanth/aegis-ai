/**
 * EvolutionBenefitEngine
 *
 * Quantifies estimated value, ROI, and expected operational improvements.
 * Hard Invariant: EXPECTED BENEFIT != REALIZED BENEFIT.
 */

export type EvolutionBenefitClassification =
  | "VERY_HIGH_VALUE"
  | "HIGH_VALUE"
  | "MODERATE_VALUE"
  | "LOW_VALUE"
  | "NEGATIVE_EXPECTED_VALUE"
  | "INSUFFICIENT_EVIDENCE";

export interface EvolutionBenefitEstimate {
  opportunityId: string;
  classification: EvolutionBenefitClassification;
  estimatedValueINR: number;
  estimatedCostINR: number;
  roiRatio: number;
  expectedReliabilityGainPercentage: number;
  expectedLatencyReductionPercentage: number;
  summary: string;
}

export class EvolutionBenefitEngine {
  public static estimateBenefit(
    opportunityId: string,
    valueINR: number,
    costINR: number,
    reliabilityGainPercentage: number
  ): EvolutionBenefitEstimate {
    const roi = costINR > 0 ? Number((valueINR / costINR).toFixed(2)) : 10;
    let classification: EvolutionBenefitClassification = "MODERATE_VALUE";

    if (roi >= 4) classification = "VERY_HIGH_VALUE";
    else if (roi >= 2) classification = "HIGH_VALUE";
    else if (roi < 1) classification = "NEGATIVE_EXPECTED_VALUE";

    return {
      opportunityId,
      classification,
      estimatedValueINR: valueINR,
      estimatedCostINR: costINR,
      roiRatio: roi,
      expectedReliabilityGainPercentage: reliabilityGainPercentage,
      expectedLatencyReductionPercentage: 15,
      summary: `Estimated ${classification} with ROI of ${roi}x (Gain: +${reliabilityGainPercentage}% reliability).`,
    };
  }
}
