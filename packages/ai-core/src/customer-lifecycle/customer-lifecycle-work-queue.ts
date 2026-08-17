/**
 * CustomerLifecycleWorkQueue
 *
 * Prioritizes customer lifecycle and proactive success actions by churn risk, business value, and urgency.
 */

export interface CustomerLifecycleTask {
  taskId: string;
  projectId: string;
  customerId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class CustomerLifecycleWorkQueue {
  private static tasks: CustomerLifecycleTask[] = [];

  public static enqueue(task: Omit<CustomerLifecycleTask, "taskId">): CustomerLifecycleTask {
    const full: CustomerLifecycleTask = {
      ...task,
      taskId: `cl_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): CustomerLifecycleTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
