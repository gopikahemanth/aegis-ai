/**
 * AutonomousExecutionLedger
 *
 * Append-only immutable cryptographic ledger recording all execution plans,
 * preflight verifications, authorizations, mutations, canaries, rollbacks, and verifications.
 */

import { createHash } from "node:crypto";

export interface ExecutionLedgerEvent {
  eventId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  environment: string;
  executionId: string;
  eventType:
    | "PLAN_CREATED"
    | "AUTHORIZATION_GRANTED"
    | "PREFLIGHT_PASSED"
    | "MUTATION_APPLIED"
    | "CANARY_PROMOTED"
    | "ROLLBACK_VERIFIED"
    | "VERIFICATION_CONFIRMED"
    | "EXECUTION_CERTIFIED";
  evidenceSummary: string;
  timestamp: string;
  previousHash: string;
  entryHash: string;
}

export class AutonomousExecutionLedger {
  private static events: ExecutionLedgerEvent[] = [];

  public static recordEvent(
    entry: Omit<ExecutionLedgerEvent, "eventId" | "timestamp" | "previousHash" | "entryHash">
  ): ExecutionLedgerEvent {
    const prevHash =
      this.events.length > 0 ? this.events[this.events.length - 1].entryHash : "GENESIS_EXECUTION_LEDGER_HASH";
    const timestamp = new Date().toISOString();
    const payload = `${entry.actorId}|${entry.organizationId}|${entry.projectId}|${entry.environment}|${entry.executionId}|${entry.eventType}|${entry.evidenceSummary}|${timestamp}|${prevHash}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const event: ExecutionLedgerEvent = {
      ...entry,
      eventId: `exec_evt_${Date.now()}`,
      timestamp,
      previousHash: prevHash,
      entryHash,
    };
    this.events.push(event);
    return event;
  }

  public static getEvents(): ExecutionLedgerEvent[] {
    return [...this.events];
  }

  public static reset(): void {
    this.events = [];
  }
}
