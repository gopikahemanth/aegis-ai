/**
 * EngineeringKnowledgeIndex
 *
 * Persisted knowledge repository of verified historical repairs, root-cause patterns,
 * and operational recovery outcomes.
 */

export interface HistoricalRepairEntry {
  entryId: string;
  incidentType: string;
  symptomPattern: string;
  rootCause: string;
  successfulAction: string;
  affectedFiles: string[];
  verifiedOutcome: "SUCCESS" | "FAILED";
  timestamp: string;
}

export class EngineeringKnowledgeIndex {
  private static entries: HistoricalRepairEntry[] = [];

  /**
   * Record a verified successful repair in the engineering knowledge base.
   */
  public static recordRepair(entry: Omit<HistoricalRepairEntry, "entryId" | "timestamp">): HistoricalRepairEntry {
    const record: HistoricalRepairEntry = {
      ...entry,
      entryId: `know_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(record);
    return record;
  }

  /**
   * Query previous repair entries matching a symptom or incident classification.
   */
  public static querySimilarRepairs(incidentType: string): HistoricalRepairEntry[] {
    return this.entries.filter((e) => e.incidentType === incidentType && e.verifiedOutcome === "SUCCESS");
  }

  public static listAll(): HistoricalRepairEntry[] {
    return [...this.entries];
  }

  public static clear(): void {
    this.entries = [];
  }
}
