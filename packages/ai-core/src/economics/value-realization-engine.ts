/**
 * ValueRealizationEngine
 *
 * Compares investment costs vs realized business value to compute verified ROI and realization efficiency.
 */

export interface ValueRealizationReport {
  initiativeId: string;
  projectId: string;
  totalInvestmentINR: number;
  expectedValueINR: number;
  realizedValueINR: number;
  realizationRate: number; // 0 - 100%
  verifiedROI: number; // e.g. 2.5x
  efficiencyStatus: "HIGH_EFFICIENCY" | "MODERATE_EFFICIENCY" | "UNDER_PERFORMING" | "NEGATIVE_RETURN";
}

export class ValueRealizationEngine {
  public static calculateRealization(
    initiativeId: string,
    projectId: string,
    totalInvestment: number,
    expectedValue: number,
    realizedValue: number
  ): ValueRealizationReport {
    const rate = Math.round((realizedValue / (expectedValue || 1)) * 100);
    const roi = Number((realizedValue / (totalInvestment || 1)).toFixed(2));

    let status: ValueRealizationReport["efficiencyStatus"] = "HIGH_EFFICIENCY";
    if (roi < 1.0) status = "NEGATIVE_RETURN";
    else if (roi < 1.8) status = "UNDER_PERFORMING";
    else if (roi < 3.0) status = "MODERATE_EFFICIENCY";

    return {
      initiativeId,
      projectId,
      totalInvestmentINR: totalInvestment,
      expectedValueINR: expectedValue,
      realizedValueINR: realizedValue,
      realizationRate: rate,
      verifiedROI: roi,
      efficiencyStatus: status,
    };
  }
}
