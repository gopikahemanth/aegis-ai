/**
 * ProductCompletionLedger
 *
 * Append-only immutable cryptographic ledger recording all requirements,
 * feature verifications, defect repairs, browser workflow results, and final acceptance.
 */

import { createHash } from "node:crypto";

export interface ProductCompletionLedgerEntry {
  entryId: string;
  timestamp: string;
  actor: string;
  project: string;
  eventType: string;
  requirementId: string;
  evidenceReferences: string[];
  previousHash: string;
  currentHash: string;
}

export class ProductCompletionLedger {
  private static entries: ProductCompletionLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<ProductCompletionLedgerEntry, "entryId" | "timestamp" | "previousHash" | "currentHash">
  ): ProductCompletionLedgerEntry {
    const prevHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].currentHash
        : "GENESIS_PRODUCT_COMPLETION_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actor}|${entry.project}|${entry.eventType}|${entry.requirementId}|${entry.evidenceReferences.join(",")}|${timestamp}|${prevHash}`;
    const currentHash = createHash("sha256").update(payload).digest("hex");

    const record: ProductCompletionLedgerEntry = {
      ...entry,
      entryId: `pc_led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      previousHash: prevHash,
      currentHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): ProductCompletionLedgerEntry[] {
    return [...this.entries];
  }

  public static verifyIntegrity(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const current = this.entries[i];
      const prevHash =
        i === 0 ? "GENESIS_PRODUCT_COMPLETION_LEDGER_HASH" : this.entries[i - 1].currentHash;
      if (current.previousHash !== prevHash) return false;

      const payload = `${current.actor}|${current.project}|${current.eventType}|${current.requirementId}|${current.evidenceReferences.join(",")}|${current.timestamp}|${current.previousHash}`;
      const recalculated = createHash("sha256").update(payload).digest("hex");
      if (current.currentHash !== recalculated) return false;
    }
    return true;
  }

  public static reset(): void {
    this.entries = [];
  }
}
