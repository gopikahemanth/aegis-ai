/**
 * EvidenceProvenanceEngine
 *
 * Tracks the origin, lineage, confidence, and verification status of all decision claims.
 * Hard Invariant: FORECAST != OBSERVATION; SIMULATION != REAL EXECUTION; INFERENCE != VERIFICATION.
 */

export interface ProvenanceClaim {
  claimId: string;
  source: string;
  evidenceType: "OBSERVED" | "MEASURED" | "VERIFIED" | "INFERRED" | "FORECAST" | "SIMULATED" | "UNKNOWN";
  timestamp: string;
  confidence: number;
  provenance: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "SYNTHETIC";
}

export class EvidenceProvenanceEngine {
  private static claims: Map<string, ProvenanceClaim> = new Map();

  public static recordClaim(claim: ProvenanceClaim): ProvenanceClaim {
    this.claims.set(claim.claimId, claim);
    return claim;
  }

  public static getClaim(claimId: string): ProvenanceClaim | undefined {
    return this.claims.get(claimId);
  }

  public static getAllClaims(): ProvenanceClaim[] {
    return Array.from(this.claims.values());
  }

  public static reset(): void {
    this.claims.clear();
  }
}
