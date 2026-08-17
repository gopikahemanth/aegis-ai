/**
 * EvidenceLedger
 *
 * Authoritative evidence registry linking every operational claim
 * (deployments, verifications, recoveries, certifications) to immutable proof artifacts.
 */

export interface EvidenceRecord {
  claimId: string;
  claimType: "DEPLOYMENT_SUCCESS" | "VERIFICATION_PASS" | "SECURITY_AUDIT" | "RECOVERY_RESTORE" | "GATE_CERTIFICATION";
  projectId: string;
  timestamp: string;
  evidence: {
    runtimeHealth?: string;
    apiChecks?: string[];
    browserChecks?: string[];
    dbPoolHealth?: string;
    gitCommitHash?: string;
    certificateHashes?: string[];
  };
  verified: boolean;
}

export class EvidenceLedger {
  private static ledger: Map<string, EvidenceRecord> = new Map();

  /**
   * Record a verified claim with concrete supporting evidence.
   */
  public static recordClaim(record: Omit<EvidenceRecord, "claimId" | "timestamp">): EvidenceRecord {
    const claimId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRecord: EvidenceRecord = {
      ...record,
      claimId,
      timestamp: new Date().toISOString(),
    };
    this.ledger.set(claimId, fullRecord);
    return fullRecord;
  }

  public static getClaim(claimId: string): EvidenceRecord | undefined {
    return this.ledger.get(claimId);
  }

  public static listClaims(projectId?: string): EvidenceRecord[] {
    const list = Array.from(this.ledger.values());
    return projectId ? list.filter((c) => c.projectId === projectId) : list;
  }

  public static clear(): void {
    this.ledger.clear();
  }
}
