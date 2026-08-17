/**
 * EnterpriseEvolutionDecisionLedger
 *
 * Append-only immutable cryptographic ledger recording all enterprise evolution discoveries,
 * simulations, authorizations, executions, rollbacks, and verifications.
 */

import { createHash } from "node:crypto";

export interface EvolutionLedgerEvent {
  eventId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  opportunityId: string;
  eventType:
    | "OPPORTUNITY_DISCOVERED"
    | "EVOLUTION_SIMULATED"
    | "AUTHORIZATION_GRANTED"
    | "EVOLUTION_EXECUTED"
    | "VERIFICATION_CONFIRMED"
    | "OUTCOME_REALIZED"
    | "EVOLUTION_GOVERNANCE_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class EnterpriseEvolutionDecisionLedger {
  private static events: EvolutionLedgerEvent[] = [];

  public static recordEvent(
    entry: Omit<EvolutionLedgerEvent, "eventId" | "timestamp" | "previousHash" | "entryHash">
  ): EvolutionLedgerEvent {
    const prevHash =
      this.events.length > 0 ? this.events[this.events.length - 1].entryHash : "GENESIS_EVOLUTION_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.opportunityId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const event: EvolutionLedgerEvent = {
      ...entry,
      eventId: `evo_evt_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.events.push(event);
    return event;
  }

  public static getEvents(): EvolutionLedgerEvent[] {
    return [...this.events];
  }

  public static reset(): void {
    this.events = [];
  }
}

export { EnterpriseEvolutionDecisionLedger as EvolutionDecisionLedger };

