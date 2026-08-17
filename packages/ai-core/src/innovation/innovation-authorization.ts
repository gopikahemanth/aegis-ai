/**
 * InnovationAuthorizationEngine
 *
 * Governs multi-role authorization for enterprise product innovations and controlled experiments.
 * Hard Invariant: INNOVATION CONFIDENCE != INNOVATION AUTHORIZATION.
 */

export type InnovationAuthorizationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export interface InnovationAuthorizationRecord {
  authorizationId: string;
  opportunityId: string;
  authorizerId: string;
  role: string;
  tenantId: string;
  organizationId: string;
  status: InnovationAuthorizationStatus;
  authorizationSignature?: string;
  approvedAt?: string;
  expiresAt?: string;
  comments?: string;
}

export class InnovationAuthorizationEngine {
  private static authorizations: Map<string, InnovationAuthorizationRecord> = new Map();

  public static requestAuthorization(
    opportunityId: string,
    authorizerId: string,
    tenantId: string,
    organizationId: string,
    role: string = "PRODUCT_LEAD"
  ): InnovationAuthorizationRecord {
    const authorizationId = `innov_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: InnovationAuthorizationRecord = {
      authorizationId,
      opportunityId,
      authorizerId,
      role,
      tenantId,
      organizationId,
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
  ): InnovationAuthorizationRecord {
    const existing = this.authorizations.get(opportunityId);
    const record: InnovationAuthorizationRecord = {
      authorizationId: existing ? existing.authorizationId : `innov_auth_${Date.now()}`,
      opportunityId,
      authorizerId,
      role: existing ? existing.role : "PRODUCT_LEAD",
      tenantId: existing ? existing.tenantId : "tenant_default",
      organizationId: existing ? existing.organizationId : "org_default",
      status: "APPROVED",
      authorizationSignature: signature,
      approvedAt: new Date().toISOString(),
      comments: comments || "Approved under Enterprise Innovation Governance Policy.",
    };
    this.authorizations.set(opportunityId, record);
    return record;
  }

  public static getAuthorization(opportunityId: string): InnovationAuthorizationRecord | undefined {
    return this.authorizations.get(opportunityId);
  }

  public static reset(): void {
    this.authorizations.clear();
  }
}
