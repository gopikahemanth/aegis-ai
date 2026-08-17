/**
 * DecisionPortfolioEngine
 *
 * Provides organization-wide portfolio visibility across active, pending, and completed decisions.
 */

export interface PortfolioDecisionItem {
  decisionId: string;
  projectId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  status: "ACTIVE" | "PENDING_APPROVAL" | "EVALUATING" | "CLOSED";
  riskScore: number;
}

export class DecisionPortfolioEngine {
  private static items: PortfolioDecisionItem[] = [];

  public static addDecision(item: PortfolioDecisionItem): PortfolioDecisionItem {
    this.items.push(item);
    this.items.sort((a, b) => b.riskScore - a.riskScore);
    return item;
  }

  public static getPortfolio(): PortfolioDecisionItem[] {
    return [...this.items];
  }

  public static reset(): void {
    this.items = [];
  }
}
