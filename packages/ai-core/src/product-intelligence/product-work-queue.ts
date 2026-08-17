/**
 * EnterpriseProductWorkQueue
 *
 * Prioritizes product engineering and experimentation tasks based on customer value and strategic alignment.
 */

export interface ProductTask {
  taskId: string;
  projectId: string;
  opportunityId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class EnterpriseProductWorkQueue {
  private static tasks: ProductTask[] = [];

  public static enqueue(task: Omit<ProductTask, "taskId">): ProductTask {
    const full: ProductTask = {
      ...task,
      taskId: `ptask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): ProductTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
