/**
 * KnowledgeDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording all institutional knowledge discoveries,
 * validations, conflicts, human reviews, and evidence-backed reuses.
 */

import { createHash } from "node:crypto";

export interface KnowledgeLedgerEntry {
  entryId: string;
  actorId: string;
  organizationId: string;
  knowledgeId: string;
  action:
    | "KNOWLEDGE_DISCOVERED"
    | "EXPERIENCE_RECORDED"
    | "PATTERN_RECOGNIZED"
    | "KNOWLEDGE_VALIDATED"
    | "CONFLICT_DETECTED"
    | "HUMAN_REVIEW_CONDUCTED"
    | "KNOWLEDGE_REUSED"
    | "KNOWLEDGE_SUPERSEDED"
    | "KNOWLEDGE_GOVERNANCE_CERTIFIED";
  evidenceIds: string[];
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class KnowledgeDecisionLedger {
  private static entries: KnowledgeLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<KnowledgeLedgerEntry, "entryId" | "timestamp" | "previousHash" | "entryHash">
  ): KnowledgeLedgerEntry {
    const prevHash =
      this.entries.length > 0 ? this.entries[this.entries.length - 1].entryHash : "GENESIS_KNOWLEDGE_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.knowledgeId}|${entry.action}|${entry.evidenceIds.join(",")}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: KnowledgeLedgerEntry = {
      ...entry,
      entryId: `kled_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): KnowledgeLedgerEntry[] {
    return [...this.entries];
  }

  public static reset(): void {
    this.entries = [];
  }
}
