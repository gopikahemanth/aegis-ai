import { describe, it, expect } from "vitest";
import { ExecutionAuthorizationEngine } from "../execution-authorization.js";

describe("AEGIS Phase 33 — Execution Authorization Engine", () => {
  it("enforces that prediction confidence NEVER overrides production authorization policy", () => {
    const unapproved = ExecutionAuthorizationEngine.evaluateAuthorization({
      actorId: "lead_1",
      organizationId: "org_core",
      tenantId: "t_core",
      projectId: "proj_api",
      environment: "production",
      isSafeReadonlyAction: false,
      hasHumanApprovalSignature: false,
    });

    expect(unapproved.status).toBe("REQUIRES_HUMAN_AUTHORIZATION");
    expect(unapproved.isAuthorized).toBe(false);

    const approved = ExecutionAuthorizationEngine.evaluateAuthorization({
      actorId: "lead_1",
      organizationId: "org_core",
      tenantId: "t_core",
      projectId: "proj_api",
      environment: "production",
      isSafeReadonlyAction: false,
      hasHumanApprovalSignature: true,
    });

    expect(approved.isAuthorized).toBe(true);
  });

  it("rejects expired authorizations and scope mismatches", () => {
    const expired = ExecutionAuthorizationEngine.evaluateAuthorization({
      actorId: "lead_1",
      organizationId: "org_core",
      tenantId: "t_core",
      projectId: "proj_api",
      environment: "production",
      isSafeReadonlyAction: false,
      authorizationExpiresAt: new Date(Date.now() - 10000).toISOString(),
    });

    expect(expired.status).toBe("EXPIRED");

    const mismatch = ExecutionAuthorizationEngine.evaluateAuthorization({
      actorId: "lead_1",
      organizationId: "org_core",
      tenantId: "t_core",
      projectId: "proj_api",
      environment: "production",
      isSafeReadonlyAction: false,
      authorizedScope: {
        tenantId: "t_other",
        projectId: "proj_api",
        environment: "production",
      },
    });

    expect(mismatch.status).toBe("SCOPE_MISMATCH");
  });
});
