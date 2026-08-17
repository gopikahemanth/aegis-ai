/**
 * ContinuousLearningEngine
 *
 * Maintains long-term product intelligence, capturing verified successful enhancements
 * and indexing dangerous/rolled-back optimizations to prevent repeating known failures.
 */

export interface LearningRecord {
  id: string;
  topic: string;
  type: "VERIFIED_ENHANCEMENT" | "DANGEROUS_OPTIMIZATION" | "WORKFLOW_INVARIANT";
  description: string;
  evidenceReference: string;
  recordedAt: string;
}

export class ContinuousLearningEngine {
  private static knowledgeBase: LearningRecord[] = [
    {
      id: "learn_01",
      topic: "Payment Intent Batching",
      type: "VERIFIED_ENHANCEMENT",
      description: "Batching membership plan lookups in PaymentService reliably cuts checkout P95 by >70% with 0 regressions",
      evidenceReference: "Tier 46 Performance Gate",
      recordedAt: new Date().toISOString(),
    },
    {
      id: "learn_02",
      topic: "Aggressive Member Balance In-Memory Cache",
      type: "DANGEROUS_OPTIMIZATION",
      description: "Do NOT cache member balance updates in-memory across checkout flows; causes stale balance settlement errors",
      evidenceReference: "Regression Incident Post-Mortem",
      recordedAt: new Date().toISOString(),
    },
  ];

  public static getKnowledgeBase(): LearningRecord[] {
    return [...this.knowledgeBase];
  }

  public static recordLearning(record: Omit<LearningRecord, "id" | "recordedAt">): LearningRecord {
    const newRecord: LearningRecord = {
      id: `learn_${Date.now()}`,
      ...record,
      recordedAt: new Date().toISOString(),
    };
    this.knowledgeBase.push(newRecord);
    return newRecord;
  }
}
