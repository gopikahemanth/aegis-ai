/**
 * DecisionIntelligenceLedger
 *
 * Append-only cryptographically chained ledger recording all enterprise decision recommendations,
 * human authorizations, counterfactual evaluations, and organizational learnings.
 */

import { createHash } from "node:crypto";

export interface DecisionLedgerRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "RECOMMENDATION_FORMULATED" | "AUTHORIZATION_RECORDED" | "QUALITY_EVALUATED" | "LEARNING_CALIBRATED" | "DECISION_INTELLIGENCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class DecisionIntelligenceLedger {
  private static records: DecisionLedgerRecord[] = [];

  public static recordDecision(entry: Omit<DecisionLedgerRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): DecisionLedgerRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_DECISION_INTEL_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: DecisionLedgerRecord = {
      ...entry,
      recordId: `dec_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): DecisionLedgerRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
