/**
 * EnterpriseLearningWorkQueue
 *
 * Prioritized queue managing revalidation, contradiction reviews, and lesson governance tasks.
 */

export type LearningTaskPriority =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFORMATIONAL";

export type LearningTaskState =
  | "DISCOVERED"
  | "QUEUED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED";

export interface LearningTaskItem {
  taskId: string;
  category: string;
  title: string;
  priority: LearningTaskPriority;
  score: number;
  state: LearningTaskState;
  assignedTeam: string;
  createdAt: string;
}

export class EnterpriseLearningWorkQueue {
  private static tasks: LearningTaskItem[] = [];

  public static enqueue(
    task: Omit<LearningTaskItem, "taskId" | "state" | "createdAt">
  ): LearningTaskItem {
    const full: LearningTaskItem = {
      ...task,
      taskId: `ltask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      state: "DISCOVERED",
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static updateState(taskId: string, state: LearningTaskState): boolean {
    const found = this.tasks.find((t) => t.taskId === taskId);
    if (!found) return false;
    found.state = state;
    return true;
  }

  public static getTasks(): LearningTaskItem[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
