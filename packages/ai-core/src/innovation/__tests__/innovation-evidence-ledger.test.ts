import { describe, it, expect, beforeEach } from "vitest";
import { InnovationEvidenceLedger } from "../innovation-evidence-ledger.js";

describe("AEGIS Phase 40 — Innovation Evidence Ledger", () => {
  beforeEach(() => {
    InnovationEvidenceLedger.reset();
  });

  it("cryptographically binds innovation claims to empirical evidence", () => {
    const claim = InnovationEvidenceLedger.recordClaim(
      "exp_123",
      "proj_gym",
      "TRANSFORMATION_VERIFIED",
      { latencyReductionPct: 57, errorRate: 0.0, annualValueINR: 240000 },
      true
    );

    expect(claim.claimId).toBeDefined();
    expect(claim.evidenceHash).toBeDefined();
    expect(claim.verified).toBe(true);
    expect(InnovationEvidenceLedger.getClaims().length).toBe(1);
  });
});
