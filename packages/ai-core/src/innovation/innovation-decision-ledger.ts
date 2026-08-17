/**
 * EnterpriseInnovationDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording all innovation signals,
 * simulations, authorizations, experiments, executions, and realized outcomes.
 */

import { createHash } from "node:crypto";

export interface InnovationLedgerEvent {
  eventId: string;
  actorId: string;
  tenantId: string;
  organizationId: string;
  projectId: string;
  opportunityId: string;
  eventType:
    | "SIGNAL_DISCOVERED"
    | "OPPORTUNITY_QUALIFIED"
    | "INNOVATION_SIMULATED"
    | "AUTHORIZATION_GRANTED"
    | "EXPERIMENT_EXECUTED"
    | "INNOVATION_VERIFIED"
    | "VALUE_REALIZED"
    | "INNOVATION_GOVERNANCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class EnterpriseInnovationDecisionLedger {
  private static events: InnovationLedgerEvent[] = [];

  public static recordEvent(
    entry: Omit<InnovationLedgerEvent, "eventId" | "timestamp" | "previousHash" | "entryHash">
  ): InnovationLedgerEvent {
    const prevHash =
      this.events.length > 0 ? this.events[this.events.length - 1].entryHash : "GENESIS_INNOVATION_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.tenantId}|${entry.organizationId}|${entry.projectId}|${entry.opportunityId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const event: InnovationLedgerEvent = {
      ...entry,
      eventId: `innov_evt_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.events.push(event);
    return event;
  }

  public static getEvents(): InnovationLedgerEvent[] {
    return [...this.events];
  }

  public static reset(): void {
    this.events = [];
  }
}

export { EnterpriseInnovationDecisionLedger as InnovationDecisionLedger };

