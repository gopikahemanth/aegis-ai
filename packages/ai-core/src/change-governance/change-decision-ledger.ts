/**
 * EnterpriseChangeDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording all enterprise change proposals,
 * simulations, approvals, scheduling decisions, executions, rollbacks, and verifications.
 */

import { createHash } from "node:crypto";

export interface ChangeLedgerEvent {
  eventId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  changeId: string;
  eventType:
    | "CHANGE_PROPOSED"
    | "IMPACT_SIMULATED"
    | "APPROVAL_GRANTED"
    | "EXECUTION_SCHEDULED"
    | "EXECUTION_VERIFIED"
    | "ROLLBACK_CONFIRMED"
    | "CHANGE_GOVERNANCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class EnterpriseChangeDecisionLedger {
  private static events: ChangeLedgerEvent[] = [];

  public static recordEvent(
    entry: Omit<ChangeLedgerEvent, "eventId" | "timestamp" | "previousHash" | "entryHash">
  ): ChangeLedgerEvent {
    const prevHash =
      this.events.length > 0 ? this.events[this.events.length - 1].entryHash : "GENESIS_CHANGE_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.changeId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const event: ChangeLedgerEvent = {
      ...entry,
      eventId: `chg_evt_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.events.push(event);
    return event;
  }

  public static getEvents(): ChangeLedgerEvent[] {
    return [...this.events];
  }

  public static reset(): void {
    this.events = [];
  }
}
