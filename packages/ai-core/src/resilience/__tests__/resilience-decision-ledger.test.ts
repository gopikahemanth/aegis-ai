import { describe, it, expect, beforeEach } from "vitest";
import { ResilienceDecisionLedger } from "../resilience-decision-ledger.js";

describe("AEGIS Phase 27 — Resilience Decision Ledger", () => {
  beforeEach(() => {
    ResilienceDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only resilience event records", () => {
    const entry = ResilienceDecisionLedger.recordDecision({
      actorId: "sre_lead_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "VERIFY_DISASTER_RECOVERY",
      decisionType: "RESTORE_EXECUTED",
      evidenceSummary: "Live restore and schema consistency test passed in 120ms.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_RESILIENCE_HASH");
    expect(ResilienceDecisionLedger.getLedger().length).toBe(1);
  });
});
