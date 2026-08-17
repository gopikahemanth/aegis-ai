/**
 * ArchitectureMemoryEngine
 *
 * Tracks Architecture Decision Records (ADRs), decision lineage, and supersession chains.
 * Hard Invariant: Never deletes or rewrites historical architecture decisions.
 */

export interface ArchitectureDecisionRecord {
  decisionId: string;
  organizationId: string;
  projectId: string;
  title: string;
  context: string;
  decision: string;
  tradeoffs: string[];
  author: string;
  status: "ACTIVE" | "SUPERSEDED" | "MODIFIED" | "REVERSED";
  supersededBy?: string;
  recordedAt: string;
}

export class ArchitectureMemoryEngine {
  private static adrs: Map<string, ArchitectureDecisionRecord> = new Map();

  public static recordADR(adr: ArchitectureDecisionRecord): ArchitectureDecisionRecord {
    this.adrs.set(adr.decisionId, adr);
    return adr;
  }

  public static supersedeADR(
    oldDecisionId: string,
    newDecisionId: string,
    reason: string
  ): void {
    const oldADR = this.adrs.get(oldDecisionId);
    if (oldADR) {
      oldADR.status = "SUPERSEDED";
      oldADR.supersededBy = newDecisionId;
      this.adrs.set(oldDecisionId, oldADR);
    }
  }

  public static getADR(decisionId: string): ArchitectureDecisionRecord | undefined {
    return this.adrs.get(decisionId);
  }

  public static getAllADRs(): ArchitectureDecisionRecord[] {
    return Array.from(this.adrs.values());
  }

  public static reset(): void {
    this.adrs.clear();
  }
}
