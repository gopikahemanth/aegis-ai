import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeActionLedger } from "../knowledge-action-ledger.js";

describe("AEGIS Phase 43 — Knowledge Action Ledger", () => {
  beforeEach(() => {
    KnowledgeActionLedger.reset();
  });

  it("maintains append-only cryptographic links and detects hash tampering", () => {
    const e1 = KnowledgeActionLedger.recordEntry({
      actor: "vp_eng_action",
      tenant: "tenant_global",
      project: "proj_gym",
      eventType: "ACTION_PLAN_CREATED",
      actionId: "act_plan_1",
      evidenceReferences: ["ev_p99_metric"],
    });

    const e2 = KnowledgeActionLedger.recordEntry({
      actor: "vp_eng_action",
      tenant: "tenant_global",
      project: "proj_gym",
      eventType: "ACTION_OUTCOME_MEASURED",
      actionId: "act_plan_1",
      evidenceReferences: ["ev_outcome_verified"],
    });

    expect(e1.previousHash).toBe("GENESIS_KNOWLEDGE_ACTION_LEDGER_HASH");
    expect(e2.previousHash).toBe(e1.currentHash);
    expect(KnowledgeActionLedger.verifyIntegrity()).toBe(true);

    // Tampering test
    e2.currentHash = "tampered_hash_bad";
    expect(KnowledgeActionLedger.verifyIntegrity()).toBe(false);
  });
});
