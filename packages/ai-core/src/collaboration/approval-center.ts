/**
 * ApprovalCenter
 *
 * Unified enterprise approval lifecycle with immutable decision auditing.
 */

import { EnterpriseAuthorization, type EnterpriseOperation } from "../enterprise/enterprise-authorization.js";

export type ApprovalStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ApprovalRequest {
  approvalId: string;
  organizationId: string;
  projectId: string;
  environment: string;
  operation: EnterpriseOperation;
  requesterId: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
}

export class ApprovalCenter {
  private static approvals: Map<string, ApprovalRequest> = new Map();

  public static requestApproval(params: {
    approvalId: string;
    organizationId: string;
    projectId: string;
    environment: string;
    operation: EnterpriseOperation;
    requesterId: string;
  }): ApprovalRequest {
    const approval: ApprovalRequest = {
      ...params,
      status: "REQUESTED",
      requestedAt: new Date().toISOString(),
    };
    this.approvals.set(params.approvalId, approval);
    return approval;
  }

  public static decideApproval(
    approvalId: string,
    deciderUserId: string,
    decision: "APPROVED" | "REJECTED",
    reason: string
  ): { success: boolean; error?: string } {
    const req = this.approvals.get(approvalId);
    if (!req) return { success: false, error: "APPROVAL_NOT_FOUND" };
    if (req.status !== "REQUESTED") return { success: false, error: "ALREADY_DECIDED" };

    const auth = EnterpriseAuthorization.evaluate(
      deciderUserId,
      req.organizationId,
      req.projectId,
      req.environment,
      req.operation
    );

    if (auth.verdict === "DENY") {
      return { success: false, error: `UNAUTHORIZED_APPROVER: ${auth.reason}` };
    }

    req.status = decision;
    req.decidedAt = new Date().toISOString();
    req.decidedBy = deciderUserId;
    req.decisionReason = reason;

    return { success: true };
  }

  public static getApproval(approvalId: string): ApprovalRequest | undefined {
    return this.approvals.get(approvalId);
  }

  public static reset(): void {
    this.approvals.clear();
  }
}
