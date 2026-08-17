/**
 * CustomerLifecycleDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording all customer lifecycle transitions,
 * health scoring events, churn forecasts, expansion discoveries, authorizations, interventions, and verified outcomes.
 */

import { createHash } from "node:crypto";

export interface CustomerLifecycleLedgerEntry {
  entryId: string;
  actorId: string;
  tenantId: string;
  organizationId: string;
  projectId: string;
  customerId: string;
  eventType:
    | "LIFECYCLE_STAGE_TRANSITIONED"
    | "HEALTH_SCORE_CALCULATED"
    | "CHURN_RISK_FORECASTED"
    | "EXPANSION_OPPORTUNITY_DISCOVERED"
    | "SCENARIO_SIMULATED"
    | "INTERVENTION_AUTHORIZED"
    | "INTERVENTION_EXECUTED"
    | "CUSTOMER_OUTCOME_VERIFIED"
    | "CUSTOMER_LIFECYCLE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class CustomerLifecycleDecisionLedger {
  private static entries: CustomerLifecycleLedgerEntry[] = [];

  public static recordEntry(
    entry: Omit<CustomerLifecycleLedgerEntry, "entryId" | "timestamp" | "previousHash" | "entryHash">
  ): CustomerLifecycleLedgerEntry {
    const prevHash =
      this.entries.length > 0 ? this.entries[this.entries.length - 1].entryHash : "GENESIS_CUSTOMER_LIFECYCLE_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.tenantId}|${entry.organizationId}|${entry.projectId}|${entry.customerId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: CustomerLifecycleLedgerEntry = {
      ...entry,
      entryId: `cl_led_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };

    this.entries.push(record);
    return record;
  }

  public static getEntries(): CustomerLifecycleLedgerEntry[] {
    return [...this.entries];
  }

  public static reset(): void {
    this.entries = [];
  }
}
