import { describe, it, expect, beforeEach } from "vitest";
import { IdentityManager } from "../../identity/identity-manager.js";
import { AssignmentEngine } from "../assignment-engine.js";

describe("AEGIS Phase 22 — Assignment Engine", () => {
  beforeEach(() => {
    IdentityManager.reset();
    AssignmentEngine.reset();
  });

  it("blocks cross-tenant human task assignment", () => {
    IdentityManager.registerActor({
      userId: "dev_org_a",
      name: "Dev Org A",
      organizationId: "org_alpha",
      role: "DEVELOPER",
    });

    const res = AssignmentEngine.assignTask({
      assignmentId: "asgn_1",
      workflowId: "wf_1",
      organizationId: "org_beta", // target different org
      projectId: "proj_1",
      actorId: "dev_org_a",
      assigneeType: "HUMAN",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("CROSS_TENANT_ASSIGNMENT_DENIED");
  });

  it("successfully assigns tasks to authorized tenant actors", () => {
    IdentityManager.registerActor({
      userId: "dev_org_b",
      name: "Dev Org B",
      organizationId: "org_beta",
      role: "DEVELOPER",
    });

    const res = AssignmentEngine.assignTask({
      assignmentId: "asgn_2",
      workflowId: "wf_2",
      organizationId: "org_beta",
      projectId: "proj_2",
      actorId: "dev_org_b",
      assigneeType: "HUMAN",
    });

    expect(res.success).toBe(true);
    expect(res.assignment?.status).toBe("ASSIGNED");
  });
});
