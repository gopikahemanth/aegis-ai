import { describe, it, expect, beforeEach } from "vitest";
import { OrganizationManager } from "../organization-manager.js";

describe("AEGIS Phase 21 — Organization Management & Tenancy", () => {
  beforeEach(() => {
    OrganizationManager.reset();
  });

  it("creates and registers enterprise organizations with teams and project bindings", () => {
    const org = OrganizationManager.createOrganization({
      organizationId: "org_acme_corp",
      name: "Acme Corporation",
      tier: "ENTERPRISE",
      teams: [{ teamId: "t_core", name: "Core Engineering", memberUserIds: ["u1", "u2"] }],
      projectIds: ["proj_alpha"],
    });

    expect(org.organizationId).toBe("org_acme_corp");
    expect(OrganizationManager.getOrganization("org_acme_corp")?.name).toBe("Acme Corporation");

    OrganizationManager.addProjectToOrg("org_acme_corp", "proj_beta");
    expect(OrganizationManager.getOrganization("org_acme_corp")?.projectIds).toContain("proj_beta");
  });
});
