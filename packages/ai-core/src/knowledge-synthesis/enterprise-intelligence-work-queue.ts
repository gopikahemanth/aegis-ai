/**
 * EnterpriseIntelligenceWorkQueue
 *
 * Prioritizes cross-domain intelligence curation, systemic risk mitigation, and trade-off reviews.
 */

export interface IntelligenceTask {
  taskId: string;
  organizationId: string;
  category:
    | "SYSTEMIC_RISK"
    | "KNOWLEDGE_CONFLICT"
    | "INSIGHT_VALIDATION"
    | "TRADEOFF_REVIEW"
    | "OPPORTUNITY_ANALYSIS"
    | "KNOWLEDGE_GAP"
    | "SCENARIO_ANALYSIS";
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  score: number;
}

export class EnterpriseIntelligenceWorkQueue {
  private static tasks: IntelligenceTask[] = [];

  public static enqueue(task: Omit<IntelligenceTask, "taskId">): IntelligenceTask {
    const full: IntelligenceTask = {
      ...task,
      taskId: `itask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.tasks.push(full);
    this.tasks.sort((a, b) => b.score - a.score);
    return full;
  }

  public static getTasks(): IntelligenceTask[] {
    return [...this.tasks];
  }

  public static reset(): void {
    this.tasks = [];
  }
}
