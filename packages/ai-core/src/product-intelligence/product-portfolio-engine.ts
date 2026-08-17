/**
 * ProductPortfolioEngine
 *
 * Tracks enterprise-wide product portfolio health, feature outcomes, and customer value realization across NOW, NEXT, LATER, and FUTURE.
 */

export interface ProductPortfolioSummary {
  totalOpportunities: number;
  activeExperimentsCount: number;
  completedFeaturesCount: number;
  totalVerifiedValueINR: number;
  portfolioRoi: number;
  avgAdoptionRatePercentage: number;
  summary: string;
}

export class ProductPortfolioEngine {
  public static calculatePortfolio(
    totalOpps: number,
    activeExperiments: number,
    completedFeatures: number,
    verifiedValueINR: number,
    costINR: number,
    avgAdoption: number
  ): ProductPortfolioSummary {
    const roi = costINR > 0 ? Number((verifiedValueINR / costINR).toFixed(2)) : 5;

    return {
      totalOpportunities: totalOpps,
      activeExperimentsCount: activeExperiments,
      completedFeaturesCount: completedFeatures,
      totalVerifiedValueINR: verifiedValueINR,
      portfolioRoi: roi,
      avgAdoptionRatePercentage: avgAdoption,
      summary: `Product portfolio contains ${completedFeatures} completed feature(s) delivering ₹${verifiedValueINR.toLocaleString()} verified customer value (ROI: ${roi}x, Avg Adoption: ${avgAdoption}%).`,
    };
  }
}
