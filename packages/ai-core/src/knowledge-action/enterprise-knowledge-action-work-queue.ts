/**
 * EnterpriseKnowledgeActionWorkQueue
 *
 * Maintains prioritized, tracked action items generated from enterprise insights.
 * Historical records are never deleted.
 */

export type ActionWorkQueueState =
  | "DISCOVERED"
  | "QUEUED"
  | "UNDER_REVIEW"
  | "AUTHORIZED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "BLOCKED"
  | "CANCELLED";

export interface ActionWorkItem {
  itemId: string;
  actionId: string;
  sourceInsightId: string;
  title: string;
  state: ActionWorkQueueState;
  priorityScore: number;
  assignedTeam: string;
  stateHistory: Array<{ state: ActionWorkQueueState; timestamp: string }>;
  createdAt: string;
}

export class EnterpriseKnowledgeActionWorkQueue {
  private static items: ActionWorkItem[] = [];

  public static enqueue(
    item: Omit<ActionWorkItem, "itemId" | "state" | "stateHistory" | "createdAt">
  ): ActionWorkItem {
    const full: ActionWorkItem = {
      ...item,
      itemId: `witem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      state: "DISCOVERED",
      stateHistory: [{ state: "DISCOVERED", timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    this.items.push(full);
    this.items.sort((a, b) => b.priorityScore - a.priorityScore);
    return full;
  }

  public static transitionState(
    itemId: string,
    newState: ActionWorkQueueState
  ): ActionWorkItem | null {
    const found = this.items.find((i) => i.itemId === itemId);
    if (!found) return null;

    found.state = newState;
    found.stateHistory.push({ state: newState, timestamp: new Date().toISOString() });
    return found;
  }

  public static getItems(): ActionWorkItem[] {
    return [...this.items];
  }

  public static reset(): void {
    this.items = [];
  }
}
