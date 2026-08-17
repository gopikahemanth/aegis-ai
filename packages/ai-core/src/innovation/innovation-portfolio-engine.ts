/**
 * InnovationPortfolioEngine
 *
 * Tracks enterprise innovation portfolios, realized value, and investment ROI across NOW, NEXT, LATER, and FUTURE horizons.
 */

export interface InnovationPortfolioSummary {
  totalOpportunities: number;
  activeExperimentsCount: number;
  approvedInnovationsCount: number;
  completedInnovationsCount: number;
  totalExpectedValueINR: number;
  totalVerifiedValueINR: number;
  portfolioRoi: number;
  realizationRatePercentage: number;
  summary: string;
}

export class InnovationPortfolioEngine {
  public static calculatePortfolio(
    totalOpps: number,
    activeExperiments: number,
    approved: number,
    completed: number,
    expectedValINR: number,
    verifiedValINR: number,
    totalCostINR: number
  ): InnovationPortfolioSummary {
    const roi = totalCostINR > 0 ? Number((verifiedValINR / totalCostINR).toFixed(2)) : 5;
    const rate = expectedValINR > 0 ? Math.min(100, Math.round((verifiedValINR / expectedValINR) * 100)) : 100;

    return {
      totalOpportunities: totalOpps,
      activeExperimentsCount: activeExperiments,
      approvedInnovationsCount: approved,
      completedInnovationsCount: completed,
      totalExpectedValueINR: expectedValINR,
      totalVerifiedValueINR: verifiedValINR,
      portfolioRoi: roi,
      realizationRatePercentage: rate,
      summary: `Innovation portfolio contains ${completed} completed innovation(s) delivering ₹${verifiedValINR.toLocaleString()} verified value (ROI: ${roi}x, Realization: ${rate}%).`,
    };
  }
}
