import { describe, it, expect, beforeEach } from "vitest";
import { IdentityManager } from "../../identity/identity-manager.js";

describe("AEGIS Phase 18 — Multi-Tenant Isolation & Role Authorization", () => {
  beforeEach(() => {
    IdentityManager.reset();
  });

  it("blocks cross-tenant operations strictly with TENANT_ISOLATION_VIOLATION", () => {
    IdentityManager.registerActor({
      userId: "user_alice",
      name: "Alice",
      organizationId: "org_acme",
      role: "DEVELOPER",
    });

    const check = IdentityManager.authorizeOperation("user_alice", "CODE_EDIT", "org_globex");
    expect(check.authorized).toBe(false);
    expect(check.reason).toContain("TENANT_ISOLATION_VIOLATION");
  });

  it("enforces role boundaries requiring RELEASE_MANAGER for production deployments", () => {
    IdentityManager.registerActor({
      userId: "user_bob",
      name: "Bob",
      organizationId: "org_acme",
      role: "DEVELOPER",
    });

    const check = IdentityManager.authorizeOperation("user_bob", "DEPLOY_PRODUCTION", "org_acme");
    expect(check.authorized).toBe(false);
    expect(check.reason).toContain("INSUFFICIENT_PERMISSIONS");
  });
});
