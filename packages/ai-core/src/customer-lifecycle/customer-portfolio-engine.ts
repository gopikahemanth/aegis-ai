/**
 * EnterpriseCustomerPortfolioEngine
 *
 * Provides enterprise-wide visibility into customer lifecycle health, retention risk distribution, and realized value.
 */

export interface EnterpriseCustomerPortfolioSummary {
  totalCustomers: number;
  healthyCustomersCount: number;
  watchCustomersCount: number;
  atRiskCustomersCount: number;
  criticalCustomersCount: number;
  totalVerifiedCustomerValueINR: number;
  portfolioRetentionRatePct: number;
  summary: string;
}

export class EnterpriseCustomerPortfolioEngine {
  public static calculatePortfolio(
    total: number,
    healthy: number,
    watch: number,
    atRisk: number,
    critical: number,
    verifiedValueINR: number
  ): EnterpriseCustomerPortfolioSummary {
    const retentionRate = total > 0 ? Math.round(((healthy + watch) / total) * 100) : 100;

    return {
      totalCustomers: total,
      healthyCustomersCount: healthy,
      watchCustomersCount: watch,
      atRiskCustomersCount: atRisk,
      criticalCustomersCount: critical,
      totalVerifiedCustomerValueINR: verifiedValueINR,
      portfolioRetentionRatePct: retentionRate,
      summary: `Customer portfolio contains ${total} account(s) (${retentionRate}% healthy/watch, delivering ₹${verifiedValueINR.toLocaleString()} verified value).`,
    };
  }
}
