import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseReliabilityLedger } from "../enterprise-reliability-ledger.js";

describe("AEGIS Phase 30 — Enterprise Reliability Ledger", () => {
  beforeEach(() => {
    EnterpriseReliabilityLedger.reset();
  });

  it("records cryptographically hashed, append-only reliability decision records", () => {
    const entry = EnterpriseReliabilityLedger.recordDecision({
      actorId: "rel_eng_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "COORDINATE_MULTI_SYSTEM_RECOVERY",
      decisionType: "RECOVERY_COORDINATED",
      evidenceSummary: "Multi-system failover coordinated cleanly across 7 stages.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_RELIABILITY_HASH");
    expect(EnterpriseReliabilityLedger.getLedger().length).toBe(1);
  });
});
