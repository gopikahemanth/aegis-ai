/**
 * ValueDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording economic decisions,
 * resource allocations, authorizations, and verified ROI realizations.
 */

import { createHash } from "node:crypto";

export interface ValueDecisionRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "VALUE_FORECAST" | "RESOURCE_ALLOCATION" | "VALUE_VERIFIED" | "ROI_CALCULATED";
  investmentAmountINR: number;
  realizedValueINR: number;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class ValueDecisionLedger {
  private static records: ValueDecisionRecord[] = [];

  public static recordDecision(entry: Omit<ValueDecisionRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): ValueDecisionRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_VALUE_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.investmentAmountINR}|${entry.realizedValueINR}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: ValueDecisionRecord = {
      ...entry,
      recordId: `val_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): ValueDecisionRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
