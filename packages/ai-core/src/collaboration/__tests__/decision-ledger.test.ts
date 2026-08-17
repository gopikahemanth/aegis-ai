import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseDecisionLedger } from "../decision-ledger.js";

describe("AEGIS Phase 22 — Enterprise Decision Ledger", () => {
  beforeEach(() => {
    EnterpriseDecisionLedger.reset();
  });

  it("appends tamper-evident decision entries with cryptographic hashes", () => {
    const entry = EnterpriseDecisionLedger.recordDecision({
      actorId: "lead_arch",
      organizationId: "org_global",
      projectId: "proj_master",
      operation: "DEPLOY_PRODUCTION",
      decision: "APPROVED",
      reason: "All 11 verification gates passed.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.entryHash.length).toBeGreaterThan(8);
    expect(EnterpriseDecisionLedger.listDecisions("proj_master").length).toBe(1);
  });
});
