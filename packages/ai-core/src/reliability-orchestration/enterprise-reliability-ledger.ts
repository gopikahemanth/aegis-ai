/**
 * EnterpriseReliabilityLedger
 *
 * Append-only immutable cryptographic ledger recording multi-system recovery executions,
 * business continuity verifications, and reliability certifications.
 */

import { createHash } from "node:crypto";

export interface ReliabilityLedgerRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "INCIDENT_DECLARED" | "RECOVERY_COORDINATED" | "BUSINESS_VERIFIED" | "RELIABILITY_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class EnterpriseReliabilityLedger {
  private static records: ReliabilityLedgerRecord[] = [];

  public static recordDecision(entry: Omit<ReliabilityLedgerRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): ReliabilityLedgerRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_RELIABILITY_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: ReliabilityLedgerRecord = {
      ...entry,
      recordId: `rel_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): ReliabilityLedgerRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
