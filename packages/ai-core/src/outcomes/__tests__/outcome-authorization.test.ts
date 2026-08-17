import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeAuthorizationManager } from "../outcome-authorization.js";
import { IdentityManager } from "../../identity/identity-manager.js";

describe("AEGIS Phase 24 — Outcome-Based Authorization Manager", () => {
  beforeEach(() => {
    OutcomeAuthorizationManager.reset();
    IdentityManager.reset();
  });

  it("enforces role-scoped strategic outcome authorization", () => {
    IdentityManager.registerActor({
      userId: "cto_1",
      name: "Chief Technology Officer",
      organizationId: "org_alpha",
      role: "PLATFORM_ADMIN",
    });

    const result = OutcomeAuthorizationManager.authorizeExecution({
      authorizationId: "auth_outcome_1",
      initiativeId: "init_1",
      organizationId: "org_alpha",
      authorizerUserId: "cto_1",
      targetProjects: ["proj_1"],
      expectedOutcome: "Reduce latency by 50%",
    });

    expect(result.success).toBe(true);
    expect(result.authorization?.authorized).toBe(true);
  });

  it("rejects unauthorized actors without administrative roles", () => {
    IdentityManager.registerActor({
      userId: "guest_1",
      name: "Guest",
      organizationId: "org_alpha",
      role: "GUEST",
    });

    const result = OutcomeAuthorizationManager.authorizeExecution({
      authorizationId: "auth_outcome_2",
      initiativeId: "init_1",
      organizationId: "org_alpha",
      authorizerUserId: "guest_1",
      targetProjects: ["proj_1"],
      expectedOutcome: "Reduce latency by 50%",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("UNAUTHORIZED_ROLE");
  });
});
