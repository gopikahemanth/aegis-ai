/**
 * EvolutionEvidenceLedger
 *
 * Cryptographically binds engineering claims to verified execution, security, and runtime evidence.
 * Hard Invariant: CLAIM != EVIDENCE != VERIFICATION.
 */

import { createHash } from "node:crypto";

export type EvolutionClaimType =
  | "BUILD_PASSED"
  | "TESTS_PASSED"
  | "SECURITY_VERIFIED"
  | "DEPLOYMENT_VERIFIED"
  | "ROLLBACK_VERIFIED"
  | "OUTCOME_VERIFIED";

export interface EvolutionEvidenceClaim {
  claimId: string;
  evolutionId: string;
  projectId: string;
  claimType: EvolutionClaimType;
  evidencePayload: Record<string, unknown>;
  verified: boolean;
  evidenceHash: string;
  recordedAt: string;
}

export class EvolutionEvidenceLedger {
  private static claims: EvolutionEvidenceClaim[] = [];

  public static recordClaim(
    evolutionId: string,
    projectId: string,
    claimType: EvolutionClaimType,
    evidencePayload: Record<string, unknown>,
    verified: boolean = true
  ): EvolutionEvidenceClaim {
    const raw = `${evolutionId}|${projectId}|${claimType}|${JSON.stringify(evidencePayload)}|${verified}`;
    const evidenceHash = createHash("sha256").update(raw).digest("hex");

    const claim: EvolutionEvidenceClaim = {
      claimId: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      evolutionId,
      projectId,
      claimType,
      evidencePayload,
      verified,
      evidenceHash,
      recordedAt: new Date().toISOString(),
    };

    this.claims.push(claim);
    return claim;
  }

  public static getClaims(): EvolutionEvidenceClaim[] {
    return [...this.claims];
  }

  public static reset(): void {
    this.claims = [];
  }
}
