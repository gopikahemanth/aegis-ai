/**
 * ResilienceDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording risk detection,
 * scenario simulations, disaster recovery executions, and resilience certifications.
 */

import { createHash } from "node:crypto";

export interface ResilienceDecisionRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "RISK_DETECTED" | "SCENARIO_SIMULATED" | "RESTORE_EXECUTED" | "RESILIENCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class ResilienceDecisionLedger {
  private static records: ResilienceDecisionRecord[] = [];

  public static recordDecision(entry: Omit<ResilienceDecisionRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): ResilienceDecisionRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_RESILIENCE_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: ResilienceDecisionRecord = {
      ...entry,
      recordId: `res_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): ResilienceDecisionRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
