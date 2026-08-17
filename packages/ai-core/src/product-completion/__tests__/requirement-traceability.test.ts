import { describe, it, expect, beforeEach } from "vitest";
import { RequirementTraceabilityEngine } from "../requirement-traceability-engine.js";

describe("AEGIS Phase 45 — Requirement Traceability Engine", () => {
  beforeEach(() => {
    RequirementTraceabilityEngine.reset();
  });

  it("maintains end-to-end traceability from requirements to code, tests, workflows, and evidence", () => {
    RequirementTraceabilityEngine.registerTrace({
      requirementId: "REQ-001",
      userPromptSnippet: "Build gym management system with member registration",
      architectureContractHash: "arch_hash_gym_01",
      sourceFiles: ["src/features/members/MemberListPage.tsx", "server/routes/member.routes.ts"],
      apiEndpoints: ["POST /api/members", "GET /api/members"],
      dbModels: ["Member"],
      unitTests: ["member.test.ts"],
      browserWorkflowIds: ["bwf_member_reg"],
      evidenceIds: ["ev_member_passed"],
    });

    expect(RequirementTraceabilityEngine.getTrace("REQ-001")).toBeDefined();
    expect(RequirementTraceabilityEngine.verifyFullTraceability()).toBe(true);
  });
});
