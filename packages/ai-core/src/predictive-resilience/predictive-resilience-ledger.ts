/**
 * PredictiveResilienceLedger
 *
 * Append-only immutable cryptographic ledger recording failure forecasts,
 * pre-incident interventions, governed recoveries, and calibration events.
 */

import { createHash } from "node:crypto";

export interface PredictiveLedgerRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "FAILURE_FORECAST" | "INTERVENTION_PLANNED" | "RECOVERY_EXECUTED" | "PREDICTION_CALIBRATED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class PredictiveResilienceLedger {
  private static records: PredictiveLedgerRecord[] = [];

  public static recordDecision(entry: Omit<PredictiveLedgerRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): PredictiveLedgerRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_PREDICTIVE_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: PredictiveLedgerRecord = {
      ...entry,
      recordId: `pred_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): PredictiveLedgerRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
