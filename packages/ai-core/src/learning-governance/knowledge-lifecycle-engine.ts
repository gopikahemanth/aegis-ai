/**
 * KnowledgeLifecycleEngine
 *
 * Governs the lifecycle transitions of enterprise knowledge without deleting historical records.
 */

export type GovernedKnowledgeStage =
  | "DISCOVERED"
  | "VALIDATING"
  | "VERIFIED"
  | "ACTIVE"
  | "AGING"
  | "STALE"
  | "EXPIRED"
  | "ARCHIVED";

export interface KnowledgeLifecycleTransition {
  previousState: GovernedKnowledgeStage;
  newState: GovernedKnowledgeStage;
  reason: string;
  evidenceId: string;
  actor: string;
  timestamp: string;
}

export interface GovernedKnowledgeLifecycleRecord {
  knowledgeId: string;
  currentStage: GovernedKnowledgeStage;
  transitions: KnowledgeLifecycleTransition[];
  updatedAt: string;
}

export class KnowledgeLifecycleEngine {
  private static records: Map<string, GovernedKnowledgeLifecycleRecord> = new Map();

  public static initializeRecord(knowledgeId: string, actor: string = "system"): GovernedKnowledgeLifecycleRecord {
    const record: GovernedKnowledgeLifecycleRecord = {
      knowledgeId,
      currentStage: "DISCOVERED",
      transitions: [
        {
          previousState: "DISCOVERED",
          newState: "DISCOVERED",
          reason: "Initial discovery and registration.",
          evidenceId: "ev_genesis",
          actor,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.records.set(knowledgeId, record);
    return record;
  }

  public static transition(
    knowledgeId: string,
    targetStage: GovernedKnowledgeStage,
    reason: string,
    evidenceId: string,
    actor: string
  ): GovernedKnowledgeLifecycleRecord {
    const r = this.records.get(knowledgeId) || this.initializeRecord(knowledgeId, actor);
    const prev = r.currentStage;
    r.currentStage = targetStage;
    r.transitions.push({
      previousState: prev,
      newState: targetStage,
      reason,
      evidenceId,
      actor,
      timestamp: new Date().toISOString(),
    });
    r.updatedAt = new Date().toISOString();
    this.records.set(knowledgeId, r);
    return r;
  }

  public static getRecord(knowledgeId: string): GovernedKnowledgeLifecycleRecord | undefined {
    return this.records.get(knowledgeId);
  }

  public static reset(): void {
    this.records.clear();
  }
}
