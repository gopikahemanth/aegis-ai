import { describe, it, expect, beforeEach } from "vitest";
import { IdentityManager } from "../../identity/identity-manager.js";
import { EnterpriseAuthorization } from "../enterprise-authorization.js";

describe("AEGIS Phase 21 — Enterprise Hierarchical Authorization", () => {
  beforeEach(() => {
    IdentityManager.reset();
  });

  it("enforces tenant boundaries preventing cross-tenant operations", () => {
    IdentityManager.registerActor({
      userId: "dev_user_1",
      name: "Developer 1",
      organizationId: "org_alpha",
      role: "DEVELOPER",
    });

    const evalRes = EnterpriseAuthorization.evaluate(
      "dev_user_1",
      "org_beta", // target different org
      "proj_1",
      "production",
      "CREATE_GENERATION"
    );

    expect(evalRes.verdict).toBe("DENY");
    expect(evalRes.reason).toContain("CROSS_TENANT_ACCESS_DENIED");
  });

  it("requires release approval for production deployments by non-release-managers", () => {
    IdentityManager.registerActor({
      userId: "dev_user_2",
      name: "Developer 2",
      organizationId: "org_alpha",
      role: "DEVELOPER",
    });

    const evalRes = EnterpriseAuthorization.evaluate(
      "dev_user_2",
      "org_alpha",
      "proj_1",
      "production",
      "DEPLOY_PRODUCTION"
    );

    expect(evalRes.verdict).toBe("REQUIRES_APPROVAL");
  });
});
