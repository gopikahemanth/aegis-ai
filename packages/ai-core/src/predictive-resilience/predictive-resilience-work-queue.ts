/**
 * PredictiveResilienceWorkQueue
 *
 * Prioritizes predictive interventions maintaining full lineage from prediction to execution.
 */

export interface PredictiveWorkItem {
  itemId: string;
  projectId: string;
  title: string;
  predictionId: string;
  priorityScore: number;
  type: "HIGH_CONFIDENCE_FAILURE_FORECAST" | "READINESS_DECLINE" | "PRE_INCIDENT_INTERVENTION";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export class PredictiveResilienceWorkQueue {
  private static queue: PredictiveWorkItem[] = [];

  public static enqueue(item: Omit<PredictiveWorkItem, "itemId">): PredictiveWorkItem {
    const full: PredictiveWorkItem = {
      ...item,
      itemId: `pwq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.queue.push(full);
    this.queue.sort((a, b) => b.priorityScore - a.priorityScore);
    return full;
  }

  public static getQueue(): PredictiveWorkItem[] {
    return [...this.queue];
  }

  public static reset(): void {
    this.queue = [];
  }
}
