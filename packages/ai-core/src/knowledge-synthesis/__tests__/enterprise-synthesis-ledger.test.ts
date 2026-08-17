import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseSynthesisLedger } from "../enterprise-synthesis-ledger.js";

describe("AEGIS Phase 42 — Enterprise Synthesis Ledger", () => {
  beforeEach(() => {
    EnterpriseSynthesisLedger.reset();
  });

  it("maintains an append-only cryptographically linked audit chain", () => {
    const e1 = EnterpriseSynthesisLedger.recordEntry({
      actor: "vp_eng_arch",
      organizationId: "org_global",
      operation: "SYNTHESIS_GENERATED",
      sourceIds: ["k_pool_1", "ADR-014"],
      evidenceIds: ["ev_1", "ev_2"],
    });

    const e2 = EnterpriseSynthesisLedger.recordEntry({
      actor: "vp_eng_arch",
      organizationId: "org_global",
      operation: "INSIGHT_VALIDATED",
      sourceIds: ["ins_1"],
      evidenceIds: ["ev_3"],
    });

    expect(e1.previousHash).toBe("GENESIS_SYNTHESIS_LEDGER_HASH");
    expect(e2.previousHash).toBe(e1.currentHash);
    expect(EnterpriseSynthesisLedger.getEntries().length).toBe(2);
  });
});
