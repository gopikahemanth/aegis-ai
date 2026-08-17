/**
 * EnterpriseInnovationWorkQueue
 *
 * Prioritizes innovation tasks and governed experiments by strategic value and customer demand.
 */

export interface InnovationTask {
  taskId: string;
  projectId: string;
  opportunityId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class EnterpriseInnovationWorkQueue {
  private static tasks: InnovationTask[] = [];

  public static enqueue(task: Omit<InnovationTask, "taskId">): InnovationTask {
    const full: InnovationTask = {
      ...task,
      taskId: `innov_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): InnovationTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}

export { EnterpriseInnovationWorkQueue as InnovationWorkQueue };

