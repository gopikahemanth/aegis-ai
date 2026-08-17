import { describe, it, expect, beforeEach } from "vitest";
import { IdentityManager } from "../../identity/identity-manager.js";
import { ApprovalCenter } from "../approval-center.js";

describe("AEGIS Phase 22 — Approval Center", () => {
  beforeEach(() => {
    IdentityManager.reset();
    ApprovalCenter.reset();
  });

  it("governs approval request lifecycle and enforces decider authorization", () => {
    IdentityManager.registerActor({
      userId: "rel_mgr_1",
      name: "Release Manager 1",
      organizationId: "org_alpha",
      role: "RELEASE_MANAGER",
    });

    const approval = ApprovalCenter.requestApproval({
      approvalId: "appr_1",
      organizationId: "org_alpha",
      projectId: "proj_1",
      environment: "production",
      operation: "DEPLOY_PRODUCTION",
      requesterId: "dev_1",
    });

    expect(approval.status).toBe("REQUESTED");

    const decision = ApprovalCenter.decideApproval(
      "appr_1",
      "rel_mgr_1",
      "APPROVED",
      "Verified all release criteria"
    );

    expect(decision.success).toBe(true);
    expect(ApprovalCenter.getApproval("appr_1")?.status).toBe("APPROVED");
  });
});
