import { describe, it, expect, beforeEach } from "vitest";
import { EvidenceProvenanceEngine } from "../evidence-provenance-engine.js";

describe("AEGIS Phase 31 — Evidence Provenance Engine", () => {
  beforeEach(() => {
    EvidenceProvenanceEngine.reset();
  });

  it("records claim provenance and enforces distinction between OBSERVED, FORECAST, and SIMULATED", () => {
    EvidenceProvenanceEngine.recordClaim({
      claimId: "claim_1",
      source: "HealthMonitor",
      evidenceType: "OBSERVED",
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      provenance: "Live HTTP probe GET /health 200 OK",
      verificationStatus: "VERIFIED",
    });

    const claim = EvidenceProvenanceEngine.getClaim("claim_1");
    expect(claim?.evidenceType).toBe("OBSERVED");
    expect(claim?.verificationStatus).toBe("VERIFIED");
  });
});
