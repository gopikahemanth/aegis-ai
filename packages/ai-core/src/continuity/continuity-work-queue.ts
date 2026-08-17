/**
 * ContinuityWorkQueue
 *
 * Prioritizes disaster recovery and business continuity engineering work items.
 */

export interface ContinuityWorkItem {
  itemId: string;
  projectId: string;
  title: string;
  priorityScore: number; // 0 - 100
  type: "FAILED_RECOVERY_TEST" | "RTO_BREACH" | "RPO_BREACH" | "SINGLE_POINT_OF_FAILURE" | "BACKUP_OPTIMIZATION";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export class ContinuityWorkQueue {
  private static queue: ContinuityWorkItem[] = [];

  public static enqueue(item: Omit<ContinuityWorkItem, "itemId">): ContinuityWorkItem {
    const full: ContinuityWorkItem = {
      ...item,
      itemId: `cwq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.queue.push(full);
    this.queue.sort((a, b) => b.priorityScore - a.priorityScore);
    return full;
  }

  public static getQueue(): ContinuityWorkItem[] {
    return [...this.queue];
  }

  public static reset(): void {
    this.queue = [];
  }
}
