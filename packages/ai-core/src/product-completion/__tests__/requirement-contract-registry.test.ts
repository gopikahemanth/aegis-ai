import { describe, it, expect, beforeEach } from "vitest";
import { RequirementContractRegistry } from "../requirement-contract-registry.js";

describe("AEGIS Phase 45 — Requirement Contract Registry", () => {
  beforeEach(() => {
    RequirementContractRegistry.reset();
  });

  it("registers requirements with unique stable IDs and tracks verification status", () => {
    const req = RequirementContractRegistry.registerRequirement({
      requirementId: "REQ-001",
      category: "FUNCTIONAL",
      title: "Member Registration",
      description: "Allow gym staff to register new gym members and record attendance.",
      acceptanceCriteria: ["Form inputs valid", "Member persisted to Postgres", "JWT required"],
      userRoles: ["staff", "admin"],
      isCritical: true,
      targetFiles: ["src/features/members/MemberListPage.tsx"],
      apiEndpoints: ["POST /api/members", "GET /api/members"],
      dbModels: ["Member", "Attendance"],
    });

    expect(req.requirementId).toBe("REQ-001");
    expect(req.status).toBe("PENDING");

    RequirementContractRegistry.updateStatus("REQ-001", "VERIFIED", "ev_member_reg_01");
    const updated = RequirementContractRegistry.getRequirement("REQ-001");
    expect(updated?.status).toBe("VERIFIED");
    expect(updated?.verifiedEvidenceIds).toContain("ev_member_reg_01");
  });
});
