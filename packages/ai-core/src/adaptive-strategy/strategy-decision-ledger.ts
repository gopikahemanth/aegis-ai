/**
 * StrategyDecisionLedger
 *
 * Append-only immutable ledger tracking strategic evaluations, authorizations, and outcomes.
 */

import { createHash } from "node:crypto";

export interface StrategyDecisionRecord {
  decisionId: string;
  actorId: string;
  organizationId: string;
  operation: string;
  recommendation: string;
  decision: "APPROVED" | "REJECTED" | "DEFERRED";
  reason: string;
  timestamp: string;
  entryHash: string;
}

export class StrategyDecisionLedger {
  private static entries: StrategyDecisionRecord[] = [];

  public static recordDecision(entry: Omit<StrategyDecisionRecord, "entryHash" | "timestamp">): StrategyDecisionRecord {
    const timestamp = new Date().toISOString();
    const payload = `${entry.decisionId}|${entry.actorId}|${entry.organizationId}|${entry.operation}|${entry.decision}|${entry.reason}|${timestamp}`;
    const entryHash = createHash("sha256").update(payload).digest("hex");

    const record: StrategyDecisionRecord = {
      ...entry,
      timestamp,
      entryHash,
    };
    this.entries.push(record);
    return record;
  }

  public static getDecisions(): StrategyDecisionRecord[] {
    return [...this.entries];
  }

  public static reset(): void {
    this.entries = [];
  }
}
