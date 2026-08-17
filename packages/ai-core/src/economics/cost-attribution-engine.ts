/**
 * CostAttributionEngine
 *
 * Attributable resource and monetary cost accounting across LLM tokens,
 * compute, worker leases, CI/CD, and database operations.
 */

export interface CostRecord {
  recordId: string;
  organizationId: string;
  projectId: string;
  initiativeId?: string;
  category: "LLM_TOKENS" | "COMPUTE_WORKER" | "CICD_BUILD" | "DATABASE_STORAGE" | "OPERATIONAL_INFRA";
  costType: "DIRECT_COST" | "ALLOCATED_COST" | "SHARED_COST" | "ESTIMATED_COST" | "VERIFIED_COST";
  amountINR: number;
  tokensConsumed?: number;
  computeHours?: number;
  timestamp: string;
}

export class CostAttributionEngine {
  private static records: CostRecord[] = [];

  public static recordCost(cost: Omit<CostRecord, "recordId" | "timestamp">): CostRecord {
    const full: CostRecord = {
      ...cost,
      recordId: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.records.push(full);
    return full;
  }

  public static getTotalProjectCost(projectId: string): number {
    return this.records
      .filter((r) => r.projectId === projectId)
      .reduce((sum, r) => sum + r.amountINR, 0);
  }

  public static getCostRecords(organizationId?: string): CostRecord[] {
    if (organizationId) {
      return this.records.filter((r) => r.organizationId === organizationId);
    }
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
