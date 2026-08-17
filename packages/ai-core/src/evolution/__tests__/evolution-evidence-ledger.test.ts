import { describe, it, expect, beforeEach } from "vitest";
import { EvolutionEvidenceLedger } from "../evolution-evidence-ledger.js";

describe("AEGIS Phase 39 — Evolution Evidence Ledger", () => {
  beforeEach(() => {
    EvolutionEvidenceLedger.reset();
  });

  it("cryptographically binds engineering claims to verified evidence", () => {
    const claim = EvolutionEvidenceLedger.recordClaim(
      "evol_1",
      "proj_gym",
      "OUTCOME_VERIFIED",
      { technicalChecks: "PASS", slosMet: true, latencyReductionMs: 45 },
      true
    );

    expect(claim.claimId).toBeDefined();
    expect(claim.evidenceHash).toBeDefined();
    expect(claim.verified).toBe(true);
    expect(EvolutionEvidenceLedger.getClaims().length).toBe(1);
  });
});
