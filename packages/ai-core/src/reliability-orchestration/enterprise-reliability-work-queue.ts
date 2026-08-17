/**
 * EnterpriseReliabilityWorkQueue
 *
 * Prioritizes cross-project reliability interventions maintaining end-to-end lineage.
 */

export interface ReliabilityWorkItem {
  itemId: string;
  projectId: string;
  title: string;
  priorityScore: number;
  type: "CRITICAL_BUSINESS_RISK" | "ACTIVE_INCIDENT" | "CAPACITY_RISK" | "SYSTEMIC_DEPENDENCY";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
}

export class EnterpriseReliabilityWorkQueue {
  private static queue: ReliabilityWorkItem[] = [];

  public static enqueue(item: Omit<ReliabilityWorkItem, "itemId">): ReliabilityWorkItem {
    const full: ReliabilityWorkItem = {
      ...item,
      itemId: `rwq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.queue.push(full);
    this.queue.sort((a, b) => b.priorityScore - a.priorityScore);
    return full;
  }

  public static getQueue(): ReliabilityWorkItem[] {
    return [...this.queue];
  }

  public static reset(): void {
    this.queue = [];
  }
}
