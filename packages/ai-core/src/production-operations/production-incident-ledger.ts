/**
 * ProductionIncidentLedger
 *
 * Append-only cryptographically chained ledger for operational incidents & self-healing events.
 * Guarantees immutable historical lineage.
 */

import * as crypto from "crypto";

export interface IncidentLedgerEntry {
  entryId: string;
  previousHash: string;
  hash: string;
  incidentId: string;
  eventType: "INCIDENT_DETECTED" | "DIAGNOSIS_COMPLETED" | "REMEDIATION_EXECUTED" | "RECOVERY_VERIFIED" | "INCIDENT_ESCALATED" | "INCIDENT_CLOSED";
  timestamp: string;
  payload: Record<string, unknown>;
}

export class ProductionIncidentLedger {
  private static entries: IncidentLedgerEntry[] = [];
  private static readonly GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

  public static append(
    incidentId: string,
    eventType: IncidentLedgerEntry["eventType"],
    payload: Record<string, unknown>
  ): IncidentLedgerEntry {
    const previousHash = this.entries.length > 0 ? this.entries[this.entries.length - 1].hash : this.GENESIS_HASH;
    const timestamp = new Date().toISOString();
    const entryId = `entry_${Date.now()}_${this.entries.length + 1}`;

    const dataToHash = `${entryId}:${previousHash}:${incidentId}:${eventType}:${timestamp}:${JSON.stringify(payload)}`;
    const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

    const entry: IncidentLedgerEntry = {
      entryId,
      previousHash,
      hash,
      incidentId,
      eventType,
      timestamp,
      payload,
    };

    this.entries.push(entry);
    return entry;
  }

  public static getEntries(): IncidentLedgerEntry[] {
    return [...this.entries];
  }

  public static getIncidentHistory(incidentId: string): IncidentLedgerEntry[] {
    return this.entries.filter((e) => e.incidentId === incidentId);
  }

  public static verifyIntegrity(): boolean {
    if (this.entries.length === 0) return true;

    for (let i = 0; i < this.entries.length; i++) {
      const current = this.entries[i];
      const expectedPrevHash = i === 0 ? this.GENESIS_HASH : this.entries[i - 1].hash;

      if (current.previousHash !== expectedPrevHash) {
        return false;
      }

      const dataToHash = `${current.entryId}:${current.previousHash}:${current.incidentId}:${current.eventType}:${current.timestamp}:${JSON.stringify(current.payload)}`;
      const recomputedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");

      if (current.hash !== recomputedHash) {
        return false;
      }
    }

    return true;
  }

  public static reset(): void {
    this.entries = [];
  }
}
