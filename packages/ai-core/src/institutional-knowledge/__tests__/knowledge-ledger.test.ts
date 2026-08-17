import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeDecisionLedger } from "../knowledge-decision-ledger.js";

describe("AEGIS Phase 41 — Knowledge Decision Ledger", () => {
  beforeEach(() => {
    KnowledgeDecisionLedger.reset();
  });

  it("maintains an append-only cryptographically linked audit chain", () => {
    const e1 = KnowledgeDecisionLedger.recordEntry({
      actorId: "actor_1",
      organizationId: "org_global",
      knowledgeId: "k_pool_1",
      action: "KNOWLEDGE_VALIDATED",
      evidenceIds: ["ev_1", "ev_2"],
      evidenceSummary: "Validated connection pool runbook with 3 production incident logs.",
    });

    const e2 = KnowledgeDecisionLedger.recordEntry({
      actorId: "actor_2",
      organizationId: "org_global",
      knowledgeId: "k_pool_1",
      action: "KNOWLEDGE_REUSED",
      evidenceIds: ["ev_3"],
      evidenceSummary: "Reused connection pool runbook for gym service scaling.",
    });

    expect(e1.previousHash).toBe("GENESIS_KNOWLEDGE_LEDGER_HASH");
    expect(e2.previousHash).toBe(e1.entryHash);
    expect(KnowledgeDecisionLedger.getEntries().length).toBe(2);
  });
});
