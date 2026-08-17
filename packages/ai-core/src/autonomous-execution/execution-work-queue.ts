/**
 * AutonomousExecutionWorkQueue
 *
 * Prioritizes authorized execution tasks maintaining complete 8-stage lineage.
 */

export interface ExecutionQueueTask {
  taskId: string;
  projectId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  executionId: string;
  sourcePredictionId: string;
  sourceDecisionId: string;
  authorizationId: string;
  score: number;
}

export class AutonomousExecutionWorkQueue {
  private static tasks: ExecutionQueueTask[] = [];

  public static enqueue(task: Omit<ExecutionQueueTask, "taskId">): ExecutionQueueTask {
    const full: ExecutionQueueTask = {
      ...task,
      taskId: `exec_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): ExecutionQueueTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
