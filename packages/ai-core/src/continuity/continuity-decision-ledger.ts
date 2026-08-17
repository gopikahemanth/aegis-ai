/**
 * ContinuityDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording game-day simulations,
 * recovery learning calibrations, and enterprise continuity certifications.
 */

import { createHash } from "node:crypto";

export interface ContinuityDecisionRecord {
  recordId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decisionType: "RECOVERY_SIMULATED" | "LEARNING_CALIBRATED" | "REDUNDANCY_OPTIMIZED" | "CONTINUITY_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class ContinuityDecisionLedger {
  private static records: ContinuityDecisionRecord[] = [];

  public static recordDecision(entry: Omit<ContinuityDecisionRecord, "recordId" | "timestamp" | "previousHash" | "entryHash">): ContinuityDecisionRecord {
    const prevHash = this.records.length > 0 ? this.records[this.records.length - 1].entryHash : "GENESIS_CONTINUITY_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.operation}|${entry.decisionType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: ContinuityDecisionRecord = {
      ...entry,
      recordId: `cont_rec_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.records.push(record);
    return record;
  }

  public static getLedger(): ContinuityDecisionRecord[] {
    return [...this.records];
  }

  public static reset(): void {
    this.records = [];
  }
}
