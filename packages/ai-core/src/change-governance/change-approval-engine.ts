/**
 * ChangeApprovalEngine
 *
 * Governs multi-role authorization and approval workflows for enterprise changes.
 */

export type ChangeApprovalStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export interface ChangeApprovalRecord {
  approvalId: string;
  changeId: string;
  authorizerId: string;
  status: ChangeApprovalStatus;
  approvalSignature?: string;
  approvedAt?: string;
  expiresAt?: string;
  comments?: string;
}

export class ChangeApprovalEngine {
  private static approvals: Map<string, ChangeApprovalRecord> = new Map();

  public static requestApproval(changeId: string, authorizerId: string): ChangeApprovalRecord {
    const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: ChangeApprovalRecord = {
      approvalId,
      changeId,
      authorizerId,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    this.approvals.set(changeId, record);
    return record;
  }

  public static grantApproval(
    changeId: string,
    authorizerId: string,
    signature: string,
    comments?: string
  ): ChangeApprovalRecord {
    const existing = this.approvals.get(changeId);
    const record: ChangeApprovalRecord = {
      approvalId: existing ? existing.approvalId : `appr_${Date.now()}`,
      changeId,
      authorizerId,
      status: "APPROVED",
      approvalSignature: signature,
      approvedAt: new Date().toISOString(),
      comments: comments || "Approved for release under governed change policy.",
    };
    this.approvals.set(changeId, record);
    return record;
  }

  public static getApproval(changeId: string): ChangeApprovalRecord | undefined {
    return this.approvals.get(changeId);
  }

  public static reset(): void {
    this.approvals.clear();
  }
}
