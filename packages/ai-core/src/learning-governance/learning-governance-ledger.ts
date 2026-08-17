/**
 * LearningGovernanceLedger
 *
 * Append-only immutable cryptographic ledger recording all institutional learning,
 * lesson verifications, contradiction resolutions, calibrations, and revalidations.
 */

import { createHash } from "node:crypto";

export interface LearningGovernanceLedgerEntry {
  entryId: string;
  timestamp: string;
  actor: string;
  tenant: string;
  project: string;
  eventType: string;
  targetId: string;
  evidenceReferences: string[];
  previousHash: string;
  currentHash: string;
}

export class LearningGovernanceLedger {
  private static entries: LearningGovernanceLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<LearningGovernanceLedgerEntry, "entryId" | "timestamp" | "previousHash" | "currentHash">
  ): LearningGovernanceLedgerEntry {
    const prevHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].currentHash
        : "GENESIS_LEARNING_GOVERNANCE_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actor}|${entry.tenant}|${entry.project}|${entry.eventType}|${entry.targetId}|${entry.evidenceReferences.join(",")}|${timestamp}|${prevHash}`;
    const currentHash = createHash("sha256").update(payload).digest("hex");

    const record: LearningGovernanceLedgerEntry = {
      ...entry,
      entryId: `lg_led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      previousHash: prevHash,
      currentHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): LearningGovernanceLedgerEntry[] {
    return [...this.entries];
  }

  public static verifyIntegrity(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const current = this.entries[i];
      const prevHash =
        i === 0 ? "GENESIS_LEARNING_GOVERNANCE_LEDGER_HASH" : this.entries[i - 1].currentHash;
      if (current.previousHash !== prevHash) return false;

      const payload = `${current.actor}|${current.tenant}|${current.project}|${current.eventType}|${current.targetId}|${current.evidenceReferences.join(",")}|${current.timestamp}|${current.previousHash}`;
      const recalculated = createHash("sha256").update(payload).digest("hex");
      if (current.currentHash !== recalculated) return false;
    }
    return true;
  }

  public static reset(): void {
    this.entries = [];
  }
}
