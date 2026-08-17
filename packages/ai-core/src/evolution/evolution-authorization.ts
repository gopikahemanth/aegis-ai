/**
 * EvolutionAuthorizationEngine
 *
 * Governs multi-role authorization for enterprise system evolution initiatives.
 * Hard Invariant: EVOLUTION CONFIDENCE != EVOLUTION AUTHORIZATION.
 */

export type EvolutionAuthorizationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export interface EvolutionAuthorizationRecord {
  authorizationId: string;
  opportunityId: string;
  authorizerId: string;
  role: string;
  status: EvolutionAuthorizationStatus;
  authorizationSignature?: string;
  approvedAt?: string;
  expiresAt?: string;
  comments?: string;
}

export class EvolutionAuthorizationEngine {
  private static authorizations: Map<string, EvolutionAuthorizationRecord> = new Map();

  public static requestAuthorization(
    opportunityId: string,
    authorizerId: string,
    role: string = "ENTERPRISE_ARCHITECT"
  ): EvolutionAuthorizationRecord {
    const authorizationId = `evo_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: EvolutionAuthorizationRecord = {
      authorizationId,
      opportunityId,
      authorizerId,
      role,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };
    this.authorizations.set(opportunityId, record);
    return record;
  }

  public static grantAuthorization(
    opportunityId: string,
    authorizerId: string,
    signature: string,
    comments?: string
  ): EvolutionAuthorizationRecord {
    const existing = this.authorizations.get(opportunityId);
    const record: EvolutionAuthorizationRecord = {
      authorizationId: existing ? existing.authorizationId : `evo_auth_${Date.now()}`,
      opportunityId,
      authorizerId,
      role: existing ? existing.role : "ENTERPRISE_ARCHITECT",
      status: "APPROVED",
      authorizationSignature: signature,
      approvedAt: new Date().toISOString(),
      comments: comments || "Approved under Enterprise Evolution Governance Policy.",
    };
    this.authorizations.set(opportunityId, record);
    return record;
  }

  public static getAuthorization(opportunityId: string): EvolutionAuthorizationRecord | undefined {
    return this.authorizations.get(opportunityId);
  }

  public static reset(): void {
    this.authorizations.clear();
  }
}
