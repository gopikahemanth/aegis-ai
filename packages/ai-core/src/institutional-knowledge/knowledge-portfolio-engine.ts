/**
 * KnowledgePortfolioEngine
 *
 * Provides executive and architectural visibility across the organization's institutional knowledge portfolio.
 */

export interface OrganizationKnowledgePortfolioSummary {
  organizationId: string;
  totalKnowledgeItemsCount: number;
  verifiedKnowledgeItemsCount: number;
  activePatternsCount: number;
  staleKnowledgeItemsCount: number;
  activeConflictsCount: number;
  knowledgeHealthScore: number;
  summary: string;
}

export class KnowledgePortfolioEngine {
  public static calculatePortfolio(
    organizationId: string,
    totalItems: number,
    verifiedItems: number,
    patterns: number,
    staleItems: number,
    conflicts: number
  ): OrganizationKnowledgePortfolioSummary {
    const health = totalItems > 0 ? Math.round(((verifiedItems - (staleItems + conflicts)) / totalItems) * 100) : 100;

    return {
      organizationId,
      totalKnowledgeItemsCount: totalItems,
      verifiedKnowledgeItemsCount: verifiedItems,
      activePatternsCount: patterns,
      staleKnowledgeItemsCount: staleItems,
      activeConflictsCount: conflicts,
      knowledgeHealthScore: Math.max(0, health),
      summary: `Portfolio contains ${totalItems} knowledge item(s) (${verifiedItems} verified, ${patterns} active patterns, health: ${Math.max(0, health)}%).`,
    };
  }
}
