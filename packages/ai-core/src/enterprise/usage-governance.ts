/**
 * UsageGovernance
 *
 * Tracks enterprise usage (LLM tokens, worker compute hours, generation jobs) against organization quotas.
 */

export interface UsageQuota {
  organizationId: string;
  monthlyTokenBudget: number;
  tokensConsumed: number;
  monthlyJobLimit: number;
  jobsExecuted: number;
}

export interface UsageReport {
  quotaStatus: "WITHIN_LIMITS" | "NEARING_LIMIT" | "EXCEEDED";
  tokensRemaining: number;
  jobsRemaining: number;
}

export class UsageGovernance {
  private static quotas: Map<string, UsageQuota> = new Map();

  public static setQuota(quota: UsageQuota): void {
    this.quotas.set(quota.organizationId, quota);
  }

  public static checkQuota(organizationId: string): UsageReport {
    const quota = this.quotas.get(organizationId) || {
      organizationId,
      monthlyTokenBudget: 1_000_000,
      tokensConsumed: 45_000,
      monthlyJobLimit: 500,
      jobsExecuted: 12,
    };

    const tokensRemaining = Math.max(0, quota.monthlyTokenBudget - quota.tokensConsumed);
    const jobsRemaining = Math.max(0, quota.monthlyJobLimit - quota.jobsExecuted);

    const isExceeded = tokensRemaining === 0 || jobsRemaining === 0;

    return {
      quotaStatus: isExceeded ? "EXCEEDED" : "WITHIN_LIMITS",
      tokensRemaining,
      jobsRemaining,
    };
  }

  public static reset(): void {
    this.quotas.clear();
  }
}
