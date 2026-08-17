import { describe, it, expect, beforeEach } from "vitest";
import { LearningGovernanceLedger } from "../learning-governance-ledger.js";

describe("AEGIS Phase 44 — Learning Governance Ledger", () => {
  beforeEach(() => {
    LearningGovernanceLedger.reset();
  });

  it("maintains an append-only cryptographically chained ledger and detects tampering", () => {
    const entry1 = LearningGovernanceLedger.recordEntry({
      actor: "sec_officer",
      tenant: "tenant_corp",
      project: "proj_gym",
      eventType: "LESSON_VERIFIED",
      targetId: "les_pool_1",
      evidenceReferences: ["ev_telemetry_1"],
    });

    const entry2 = LearningGovernanceLedger.recordEntry({
      actor: "infra_lead",
      tenant: "tenant_corp",
      project: "proj_gym",
      eventType: "KNOWLEDGE_REVALIDATED",
      targetId: "k_pool_1",
      evidenceReferences: ["ev_telemetry_2"],
    });

    expect(entry2.previousHash).toBe(entry1.currentHash);
    expect(LearningGovernanceLedger.verifyIntegrity()).toBe(true);

    // Simulate tampering
    const entries = LearningGovernanceLedger.getEntries();
    entries[0].actor = "malicious_actor";
    expect(LearningGovernanceLedger.verifyIntegrity()).toBe(false);
  });
});
