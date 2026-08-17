/**
 * KnowledgeWorkQueue
 *
 * Prioritizes institutional memory curation tasks (validation, revalidation, conflict resolution, runbook creation).
 */

export interface KnowledgeTask {
  taskId: string;
  organizationId: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class KnowledgeWorkQueue {
  private static tasks: KnowledgeTask[] = [];

  public static enqueue(task: Omit<KnowledgeTask, "taskId">): KnowledgeTask {
    const full: KnowledgeTask = {
      ...task,
      taskId: `ktask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): KnowledgeTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
