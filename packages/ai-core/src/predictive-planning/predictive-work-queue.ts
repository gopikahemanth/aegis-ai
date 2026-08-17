/**
 * PredictiveWorkQueue
 *
 * Prioritizes recommended predictive actions while maintaining complete lineage.
 */

export interface PredictivePlanningTask {
  taskId: string;
  projectId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  forecastId: string;
  authorizationState: "AUTHORIZED" | "PENDING_AUTHORIZATION" | "NOT_REQUIRED";
  score: number;
}

export class PredictiveWorkQueue {
  private static tasks: PredictivePlanningTask[] = [];

  public static enqueue(task: Omit<PredictivePlanningTask, "taskId">): PredictivePlanningTask {
    const full: PredictivePlanningTask = {
      ...task,
      taskId: `pp_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): PredictivePlanningTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
