/**
 * ProductAuthorizationEngine
 *
 * Governs role-based authorization for product modifications, canary rollouts, and feature launches.
 * Hard Invariant: PRODUCT RECOMMENDATION != PRODUCT AUTHORIZATION.
 */

export type ProductAuthorizationState =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export interface ProductAuthorizationRecord {
  authorizationId: string;
  opportunityId: string;
  authorizerId: string;
  role: string;
  tenantId: string;
  organizationId: string;
  status: ProductAuthorizationState;
  signature?: string;
  approvedAt?: string;
  expiresAt: string;
  comments?: string;
}

export class ProductAuthorizationEngine {
  private static authorizations: Map<string, ProductAuthorizationRecord> = new Map();

  public static requestAuthorization(
    opportunityId: string,
    authorizerId: string,
    tenantId: string,
    organizationId: string,
    role: string = "VP_PRODUCT"
  ): ProductAuthorizationRecord {
    const authorizationId = `p_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: ProductAuthorizationRecord = {
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
  ): ProductAuthorizationRecord {
    const existing = this.authorizations.get(opportunityId);
    const record: ProductAuthorizationRecord = {
      authorizationId: existing ? existing.authorizationId : `p_auth_${Date.now()}`,
      opportunityId,
      authorizerId,
      role: existing ? existing.role : "VP_PRODUCT",
      tenantId: existing ? existing.tenantId : "tenant_default",
      organizationId: existing ? existing.organizationId : "org_default",
      status: "APPROVED",
      signature,
      approvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      comments: comments || "Approved under Enterprise Product Governance Policy.",
    };
    this.authorizations.set(opportunityId, record);
    return record;
  }

  public static getAuthorization(opportunityId: string): ProductAuthorizationRecord | undefined {
    return this.authorizations.get(opportunityId);
  }

  public static reset(): void {
    this.authorizations.clear();
  }
}
