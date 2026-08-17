/**
 * ProductValueIntelligenceEngine
 *
 * Measures verified business and customer value derived from features and user adoption.
 * Hard Invariant: FEATURE_RELEASE != PRODUCT_VALUE.
 */

export interface ProductValueMetric {
  featureId: string;
  adoptionPercentage: number;
  retentionLiftPercentage: number;
  conversionLiftPercentage: number;
  verifiedValueINR: number;
  costINR: number;
  roi: number;
  isVerifiedValue: boolean;
  summary: string;
}

export class ProductValueIntelligenceEngine {
  public static calculateValue(
    featureId: string,
    adoptionRate: number,
    retentionLift: number,
    conversionLift: number,
    valueINR: number,
    costINR: number,
    isEvidenceVerified: boolean = true
  ): ProductValueMetric {
    const roi = costINR > 0 ? Number((valueINR / costINR).toFixed(2)) : 5;

    return {
      featureId,
      adoptionPercentage: adoptionRate,
      retentionLiftPercentage: retentionLift,
      conversionLiftPercentage: conversionLift,
      verifiedValueINR: isEvidenceVerified ? valueINR : 0,
      costINR,
      roi,
      isVerifiedValue: isEvidenceVerified,
      summary: isEvidenceVerified
        ? `Feature ${featureId} delivered ₹${valueINR.toLocaleString()} verified value (ROI: ${roi}x, Adoption: ${adoptionRate}%).`
        : `Feature ${featureId} has unverified expected value of ₹${valueINR.toLocaleString()} (Awaiting verification evidence).`,
    };
  }
}
