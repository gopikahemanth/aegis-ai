/**
 * ActionEffectivenessEngine
 *
 * Evaluates the net multi-dimensional effectiveness of executed organizational actions.
 */

export type EffectivenessRating =
  | "EFFECTIVE"
  | "PARTIALLY_EFFECTIVE"
  | "INEFFECTIVE"
  | "NEGATIVE_EFFECT"
  | "UNKNOWN";

export interface ActionEffectivenessScorecard {
  actionId: string;
  rating: EffectivenessRating;
  benefitCostRatio: number;
  reliabilityScoreDelta: number;
  securityScoreDelta: number;
  unintendedConsequencesCount: number;
  summary: string;
}

export class ActionEffectivenessEngine {
  public static evaluateEffectiveness(
    actionId: string,
    benefitValue: number,
    costValue: number,
    reliabilityDelta: number,
    securityDelta: number,
    unintendedConsequences: number = 0
  ): ActionEffectivenessScorecard {
    const bcr = costValue > 0 ? parseFloat((benefitValue / costValue).toFixed(2)) : benefitValue;
    let rating: EffectivenessRating = "PARTIALLY_EFFECTIVE";

    if (reliabilityDelta < 0 || securityDelta < 0 || unintendedConsequences >= 3) {
      rating = "NEGATIVE_EFFECT";
    } else if (bcr >= 2.0 && reliabilityDelta >= 0 && securityDelta >= 0) {
      rating = "EFFECTIVE";
    } else if (bcr < 1.0) {
      rating = "INEFFECTIVE";
    }

    return {
      actionId,
      rating,
      benefitCostRatio: bcr,
      reliabilityScoreDelta: reliabilityDelta,
      securityScoreDelta: securityDelta,
      unintendedConsequencesCount: unintendedConsequences,
      summary: `Action ${actionId} rated ${rating} with Benefit-Cost Ratio ${bcr}.`,
    };
  }
}
