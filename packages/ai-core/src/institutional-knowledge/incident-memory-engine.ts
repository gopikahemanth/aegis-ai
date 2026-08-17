/**
 * IncidentMemoryEngine
 *
 * Maintains a searchable, factual institutional memory of past operational incidents and resolutions.
 * Hard Invariant: No fabricated historical information. Returns INSUFFICIENT_EVIDENCE when unrecorded.
 */

export interface IncidentMemoryRecord {
  incidentId: string;
  organizationId: string;
  projectId: string;
  symptoms: string[];
  rootCause: string;
  successfulResolution: string;
  failedApproaches: string[];
  recoveryDurationMinutes: number;
  lessonsLearned: string[];
  evidenceIds: string[];
  recordedAt: string;
}

export class IncidentMemoryEngine {
  private static memories: Map<string, IncidentMemoryRecord[]> = new Map();

  public static recordIncidentMemory(record: IncidentMemoryRecord): void {
    const orgRecords = this.memories.get(record.organizationId) || [];
    orgRecords.push(record);
    this.memories.set(record.organizationId, orgRecords);
  }

  public static querySimilarIncidents(
    organizationId: string,
    symptomKeyword: string
  ): IncidentMemoryRecord[] | "INSUFFICIENT_EVIDENCE" {
    const orgRecords = this.memories.get(organizationId) || [];
    const matched = orgRecords.filter((r) =>
      r.symptoms.some((s) => s.toLowerCase().includes(symptomKeyword.toLowerCase())) ||
      r.rootCause.toLowerCase().includes(symptomKeyword.toLowerCase())
    );

    if (matched.length === 0) {
      return "INSUFFICIENT_EVIDENCE";
    }

    return matched;
  }

  public static reset(): void {
    this.memories.clear();
  }
}
