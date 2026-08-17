/**
 * EnterpriseEvolutionWorkQueue
 *
 * Prioritizes evolution opportunities by business value, ROI, and risk reduction score.
 */

export interface EvolutionTask {
  taskId: string;
  projectId: string;
  opportunityId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class EnterpriseEvolutionWorkQueue {
  private static tasks: EvolutionTask[] = [];

  public static enqueue(task: Omit<EvolutionTask, "taskId">): EvolutionTask {
    const full: EvolutionTask = {
      ...task,
      taskId: `evo_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): EvolutionTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}

export { EnterpriseEvolutionWorkQueue as EvolutionWorkQueue };

