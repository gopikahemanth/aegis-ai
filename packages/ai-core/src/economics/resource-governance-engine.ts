/**
 * ResourceGovernanceEngine
 *
 * Governs resource consumption against defined financial and compute budgets.
 * States: NORMAL | WARNING | HIGH_USAGE | BUDGET_REVIEW | BUDGET_EXCEEDED | BLOCKED
 */

export interface BudgetStatus {
  budgetId: string;
  organizationId: string;
  projectId: string;
  totalBudgetINR: number;
  consumedINR: number;
  consumptionRate: number; // 0 - 100%
  status: "NORMAL" | "WARNING" | "HIGH_USAGE" | "BUDGET_REVIEW" | "BUDGET_EXCEEDED" | "BLOCKED";
}

export class ResourceGovernanceEngine {
  private static budgets: Map<string, { totalBudget: number }> = new Map();

  public static setBudget(projectId: string, totalBudget: number): void {
    this.budgets.set(projectId, { totalBudget });
  }

  public static evaluateBudget(organizationId: string, projectId: string, consumedAmount: number): BudgetStatus {
    const budget = this.budgets.get(projectId) || { totalBudget: 100000 };
    const rate = (consumedAmount / (budget.totalBudget || 1)) * 100;

    let status: BudgetStatus["status"] = "NORMAL";
    if (rate > 100) status = "BUDGET_EXCEEDED";
    else if (rate > 85) status = "HIGH_USAGE";
    else if (rate > 70) status = "WARNING";

    return {
      budgetId: `bgt_${projectId}`,
      organizationId,
      projectId,
      totalBudgetINR: budget.totalBudget,
      consumedINR: consumedAmount,
      consumptionRate: Math.round(rate),
      status,
    };
  }

  public static reset(): void {
    this.budgets.clear();
  }
}
