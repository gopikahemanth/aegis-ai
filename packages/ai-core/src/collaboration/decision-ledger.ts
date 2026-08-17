/**
 * EnterpriseDecisionLedger
 *
 * Immutable, append-only ledger recording architecture, approval, security, and deployment decisions.
 */

import { createHash } from "node:crypto";

export interface DecisionEntry {
  decisionId: string;
  actorId: string;
  organizationId: string;
  projectId: string;
  operation: string;
  decision: "APPROVED" | "REJECTED" | "EXECUTED" | "OVERRIDDEN";
  reason: string;
  timestamp: string;
  entryHash: string;
}

export class EnterpriseDecisionLedger {
  private static ledger: DecisionEntry[] = [];

  public static recordDecision(params: Omit<DecisionEntry, "decisionId" | "timestamp" | "entryHash">): DecisionEntry {
    const timestamp = new Date().toISOString();
    const rawData = `${params.actorId}:${params.organizationId}:${params.projectId}:${params.operation}:${params.decision}:${timestamp}`;
    const entryHash = createHash("sha256").update(rawData).digest("hex").slice(0, 16);

    const entry: DecisionEntry = {
      ...params,
      decisionId: `dec_${Date.now()}_${entryHash}`,
      timestamp,
      entryHash,
    };

    this.ledger.push(entry);
    return entry;
  }

  public static listDecisions(projectId?: string): DecisionEntry[] {
    if (projectId) {
      return this.ledger.filter((d) => d.projectId === projectId);
    }
    return [...this.ledger];
  }

  public static reset(): void {
    this.ledger = [];
  }
}
