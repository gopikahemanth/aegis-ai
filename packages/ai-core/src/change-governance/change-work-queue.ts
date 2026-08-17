/**
 * EnterpriseChangeWorkQueue
 *
 * Prioritizes change governance and continuous improvement tasks across the enterprise.
 */

export interface ChangeWorkTask {
  taskId: string;
  projectId: string;
  changeId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class EnterpriseChangeWorkQueue {
  private static tasks: ChangeWorkTask[] = [];

  public static enqueue(task: Omit<ChangeWorkTask, "taskId">): ChangeWorkTask {
    const full: ChangeWorkTask = {
      ...task,
      taskId: `chg_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): ChangeWorkTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
