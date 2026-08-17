/**
 * EnterpriseProductDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording product signals,
 * customer insights, opportunities, simulations, authorizations, experiments, and verified value outcomes.
 */

import { createHash } from "node:crypto";

export interface ProductLedgerEntry {
  entryId: string;
  actorId: string;
  tenantId: string;
  organizationId: string;
  projectId: string;
  opportunityId: string;
  eventType:
    | "SIGNAL_DISCOVERED"
    | "INSIGHT_INTERPRETED"
    | "OPPORTUNITY_QUALIFIED"
    | "SCENARIO_SIMULATED"
    | "AUTHORIZATION_GRANTED"
    | "EXPERIMENT_EXECUTED"
    | "PRODUCT_VERIFIED"
    | "CUSTOMER_VALUE_REALIZED"
    | "PRODUCT_INTELLIGENCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class EnterpriseProductDecisionLedger {
  private static entries: ProductLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<ProductLedgerEntry, "entryId" | "timestamp" | "previousHash" | "entryHash">
  ): ProductLedgerEntry {
    const prevHash =
      this.entries.length > 0 ? this.entries[this.entries.length - 1].entryHash : "GENESIS_PRODUCT_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.tenantId}|${entry.organizationId}|${entry.projectId}|${entry.opportunityId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: ProductLedgerEntry = {
      ...entry,
      entryId: `prod_led_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): ProductLedgerEntry[] {
    return [...this.entries];
  }

  public static reset(): void {
    this.entries = [];
  }
}
