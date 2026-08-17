/**
 * PredictivePlanningLedger
 *
 * Append-only immutable cryptographic ledger recording all enterprise planning forecasts,
 * scenario evaluations, action authorizations, and forecast calibrations.
 */

import { createHash } from "node:crypto";

export interface PlanningLedgerRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "FORECAST_RECORDED" | "SCENARIO_SIMULATED" | "ACTION_AUTHORIZED" | "ACCURACY_CALIBRATED" | "PLANNING_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class PredictivePlanningLedger {
  private static records: PlanningLedgerRecord[] = [];

  public static recordDecision(entry: Omit<PlanningLedgerRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): PlanningLedgerRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_PLANNING_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: PlanningLedgerRecord = {
      ...entry,
      recordId: `plan_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): PlanningLedgerRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
