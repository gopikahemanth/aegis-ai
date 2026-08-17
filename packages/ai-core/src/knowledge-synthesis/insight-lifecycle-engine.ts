/**
 * InsightLifecycleEngine
 *
 * Manages the structured lifecycle transitions of enterprise insights without deleting historical lineage.
 */

export type InsightLifecycleStage =
  | "DISCOVERED"
  | "SYNTHESIZING"
  | "VALIDATING"
  | "SUPPORTED"
  | "REVIEW_REQUIRED"
  | "ACCEPTED"
  | "ACTED_UPON"
  | "OUTCOME_MEASURED"
  | "CONFIRMED"
  | "REJECTED"
  | "SUPERSEDED"
  | "STALE";

export interface InsightLifecycleRecord {
  insightId: string;
  currentStage: InsightLifecycleStage;
  history: Array<{ stage: InsightLifecycleStage; transitionedAt: string }>;
  updatedAt: string;
}

export class InsightLifecycleEngine {
  private static lifecycles: Map<string, InsightLifecycleRecord> = new Map();

  public static initializeLifecycle(insightId: string): InsightLifecycleRecord {
    const record: InsightLifecycleRecord = {
      insightId,
      currentStage: "DISCOVERED",
      history: [{ stage: "DISCOVERED", transitionedAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    };
    this.lifecycles.set(insightId, record);
    return record;
  }

  public static transitionStage(
    insightId: string,
    targetStage: InsightLifecycleStage
  ): InsightLifecycleRecord {
    const r = this.lifecycles.get(insightId) || this.initializeLifecycle(insightId);
    r.currentStage = targetStage;
    r.history.push({ stage: targetStage, transitionedAt: new Date().toISOString() });
    r.updatedAt = new Date().toISOString();
    this.lifecycles.set(insightId, r);
    return r;
  }

  public static getLifecycle(insightId: string): InsightLifecycleRecord | undefined {
    return this.lifecycles.get(insightId);
  }

  public static reset(): void {
    this.lifecycles.clear();
  }
}
