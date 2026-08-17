/**
 * KnowledgeActionLedger
 *
 * Append-only immutable cryptographic ledger recording all knowledge-to-action events,
 * plans, simulations, authorizations, executions, outcomes, and closed-loop learning.
 */

import { createHash } from "node:crypto";

export interface KnowledgeActionLedgerEntry {
  entryId: string;
  timestamp: string;
  actor: string;
  tenant: string;
  project: string;
  eventType: string;
  actionId: string;
  evidenceReferences: string[];
  previousHash: string;
  currentHash: string;
}

export class KnowledgeActionLedger {
  private static entries: KnowledgeActionLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<KnowledgeActionLedgerEntry, "entryId" | "timestamp" | "previousHash" | "currentHash">
  ): KnowledgeActionLedgerEntry {
    const prevHash =
      this.entries.length > 0 ? this.entries[this.entries.length - 1].currentHash : "GENESIS_KNOWLEDGE_ACTION_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actor}|${entry.tenant}|${entry.project}|${entry.eventType}|${entry.actionId}|${entry.evidenceReferences.join(",")}|${timestamp}|${prevHash}`;
    const currentHash = createHash("sha256").update(payload).digest("hex");

    const record: KnowledgeActionLedgerEntry = {
      ...entry,
      entryId: `act_led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      previousHash: prevHash,
      currentHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): KnowledgeActionLedgerEntry[] {
    return [...this.entries];
  }

  public static verifyIntegrity(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const current = this.entries[i];
      const prevHash = i === 0 ? "GENESIS_KNOWLEDGE_ACTION_LEDGER_HASH" : this.entries[i - 1].currentHash;
      if (current.previousHash !== prevHash) return false;

      const payload = `${current.actor}|${current.tenant}|${current.project}|${current.eventType}|${current.actionId}|${current.evidenceReferences.join(",")}|${current.timestamp}|${current.previousHash}`;
      const recalculated = createHash("sha256").update(payload).digest("hex");
      if (current.currentHash !== recalculated) return false;
    }
    return true;
  }

  public static reset(): void {
    this.entries = [];
  }
}
