/**
 * EngineeringWorkQueue
 *
 * Governed prioritized work queue for autonomous actions and engineering requests.
 */

export interface WorkQueueItem {
  itemId: string;
  projectId: string;
  environment: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  category: "SECURITY" | "SLO" | "INCIDENT" | "DEPENDENCY" | "TECH_DEBT" | "OPTIMIZATION";
  proposedAction: string;
  authorizationRequired: boolean;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  createdAt: string;
}

export class EngineeringWorkQueue {
  private static queue: WorkQueueItem[] = [];

  /**
   * Enqueue a new engineering work item.
   */
  public static enqueue(item: Omit<WorkQueueItem, "itemId" | "createdAt" | "status">): WorkQueueItem {
    const queueItem: WorkQueueItem = {
      ...item,
      itemId: `work_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "QUEUED",
    };
    this.queue.push(queueItem);
    return queueItem;
  }

  /**
   * Get sorted items in priority order: CRITICAL > HIGH > MEDIUM > LOW > INFORMATIONAL.
   */
  public static listItems(projectId?: string): WorkQueueItem[] {
    const priorityWeights = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFORMATIONAL: 1 };
    let list = projectId ? this.queue.filter((i) => i.projectId === projectId) : this.queue;
    return [...list].sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
  }

  public static clear(): void {
    this.queue = [];
  }
}
