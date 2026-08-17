/**
 * EnterpriseSynthesisLedger
 *
 * Append-only immutable cryptographic ledger recording all cross-domain syntheses,
 * causal analyses, trade-off evaluations, and systemic risk insights.
 */

import { createHash } from "node:crypto";

export interface SynthesisLedgerEntry {
  entryId: string;
  timestamp: string;
  actor: string;
  organizationId: string;
  operation: string;
  sourceIds: string[];
  evidenceIds: string[];
  previousHash: string;
  currentHash: string;
}

export class EnterpriseSynthesisLedger {
  private static entries: SynthesisLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<SynthesisLedgerEntry, "entryId" | "timestamp" | "previousHash" | "currentHash">
  ): SynthesisLedgerEntry {
    const prevHash =
      this.entries.length > 0 ? this.entries[this.entries.length - 1].currentHash : "GENESIS_SYNTHESIS_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actor}|${entry.organizationId}|${entry.operation}|${entry.sourceIds.join(",")}|${entry.evidenceIds.join(",")}|${timestamp}|${prevHash}`;
    const currentHash = createHash("sha256").update(payload).digest("hex");

    const record: SynthesisLedgerEntry = {
      ...entry,
      entryId: `syn_led_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      currentHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): SynthesisLedgerEntry[] {
    return [...this.entries];
  }

  public static reset(): void {
    this.entries = [];
  }
}
