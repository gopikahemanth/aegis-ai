/**
 * ProductCompletionWorkQueue
 *
 * Prioritized queue managing missing features, defect repairs, API unwiring, and browser verification tasks.
 */

export type CompletionTaskPriority =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFORMATIONAL";

export type CompletionTaskState =
  | "DISCOVERED"
  | "QUEUED"
  | "IN_PROGRESS"
  | "REPAIRING"
  | "VERIFYING"
  | "RESOLVED";

export interface ProductCompletionTask {
  taskId: string;
  requirementId: string;
  title: string;
  priority: CompletionTaskPriority;
  score: number;
  state: CompletionTaskState;
  targetComponent: string;
  createdAt: string;
}

export class ProductCompletionWorkQueue {
  private static tasks: ProductCompletionTask[] = [];

  public static enqueue(
    task: Omit<ProductCompletionTask, "taskId" | "state" | "createdAt">
  ): ProductCompletionTask {
    const full: ProductCompletionTask = {
      ...task,
      taskId: `ptask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      state: "DISCOVERED",
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static updateState(taskId: string, state: CompletionTaskState): boolean {
    const found = this.tasks.find((t) => t.taskId === taskId);
    if (!found) return false;
    found.state = state;
    return true;
  }

  public static getTasks(): ProductCompletionTask[] {
    return [...this.tasks];
  }

  public static getUnresolvedCount(): number {
    return this.tasks.filter((t) => t.state !== "RESOLVED").length;
  }

  public static reset(): void {
    this.tasks = [];
  }
}
