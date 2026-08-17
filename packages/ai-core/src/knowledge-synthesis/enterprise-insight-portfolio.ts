/**
 * EnterpriseInsightPortfolioEngine
 *
 * Provides portfolio-level intelligence tracking, filtering, and executive oversight.
 */

export interface EnterpriseInsightPortfolioSummary {
  organizationId: string;
  totalInsightsCount: number;
  verifiedInsightsCount: number;
  systemicRisksCount: number;
  systemicOpportunitiesCount: number;
  activeTradeoffsCount: number;
  portfolioIntelligenceScore: number;
  summary: string;
}

export class EnterpriseInsightPortfolioEngine {
  public static calculatePortfolioSummary(
    organizationId: string,
    totalInsights: number,
    verifiedInsights: number,
    risks: number,
    opportunities: number,
    tradeoffs: number
  ): EnterpriseInsightPortfolioSummary {
    const score = totalInsights > 0 ? Math.round(((verifiedInsights + opportunities) / (totalInsights + risks)) * 80) : 85;

    return {
      organizationId,
      totalInsightsCount: totalInsights,
      verifiedInsightsCount: verifiedInsights,
      systemicRisksCount: risks,
      systemicOpportunitiesCount: opportunities,
      activeTradeoffsCount: tradeoffs,
      portfolioIntelligenceScore: Math.min(100, Math.max(0, score)),
      summary: `Portfolio contains ${totalInsights} insight(s) (${verifiedInsights} verified), ${risks} systemic risk(s), and ${opportunities} systemic opportunity/opportunities.`,
    };
  }
}
