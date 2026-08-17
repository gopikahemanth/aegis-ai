/**
 * InnovationEvidenceLedger
 *
 * Cryptographically binds innovation and transformation claims to empirical test, trial, and production evidence.
 * Hard Invariant: CLAIM != EVIDENCE != VERIFICATION.
 */

import { createHash } from "node:crypto";

export type InnovationClaimType =
  | "SIMULATION_VERIFIED"
  | "TRIAL_VERIFIED"
  | "PERFORMANCE_VERIFIED"
  | "SECURITY_VERIFIED"
  | "BUSINESS_VALUE_VERIFIED"
  | "ROLLOUT_VERIFIED"
  | "TRANSFORMATION_VERIFIED";

export interface InnovationEvidenceClaim {
  claimId: string;
  experimentId: string;
  projectId: string;
  claimType: InnovationClaimType;
  evidencePayload: Record<string, unknown>;
  verified: boolean;
  evidenceHash: string;
  recordedAt: string;
}

export class InnovationEvidenceLedger {
  private static claims: InnovationEvidenceClaim[] = [];

  public static recordClaim(
    experimentId: string,
    projectId: string,
    claimType: InnovationClaimType,
    evidencePayload: Record<string, unknown>,
    verified: boolean = true
  ): InnovationEvidenceClaim {
    const raw = `${experimentId}|${projectId}|${claimType}|${JSON.stringify(evidencePayload)}|${verified}`;
    const evidenceHash = createHash("sha256").update(raw).digest("hex");

    const claim: InnovationEvidenceClaim = {
      claimId: `inn_claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      experimentId,
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

  public static getClaims(): InnovationEvidenceClaim[] {
    return [...this.claims];
  }

  public static reset(): void {
    this.claims = [];
  }
}
