import { describe, it, expect, beforeEach } from "vitest";
import { ChangeApprovalEngine } from "../change-approval-engine.js";

describe("AEGIS Phase 34 — Change Approval Engine", () => {
  beforeEach(() => {
    ChangeApprovalEngine.reset();
  });

  it("manages human review and approval workflows with cryptographic signature", () => {
    const req = ChangeApprovalEngine.requestApproval("chg_1", "admin_lead_1");
    expect(req.status).toBe("PENDING");

    const approved = ChangeApprovalEngine.grantApproval(
      "chg_1",
      "admin_lead_1",
      "sig_admin_lead_chg1_valid",
      "Approved after blast-radius review"
    );
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvalSignature).toBe("sig_admin_lead_chg1_valid");
  });
});
