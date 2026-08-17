import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseChangeRegistry } from "../enterprise-change-registry.js";

describe("AEGIS Phase 34 — Enterprise Change Registry", () => {
  beforeEach(() => {
    EnterpriseChangeRegistry.reset();
  });

  it("registers lineage-bound enterprise changes and transitions state", () => {
    const chg = EnterpriseChangeRegistry.registerChange({
      projectId: "proj_api",
      organizationId: "org_alpha",
      teamId: "team_core",
      environment: "production",
      sourceExecutionId: "exec_1",
      sourceDecisionId: "dec_1",
      title: "Deploy Gateway V4",
      affectedFiles: ["server.ts"],
      affectedServices: ["gateway"],
      affectedDatabases: ["pg_main"],
      dependencies: [],
      riskClassification: "LOW",
      expectedOutcome: "Throughput +20%",
      actor: "admin_lead",
    });

    expect(chg.changeId).toBeDefined();
    expect(chg.status).toBe("PROPOSED");

    const analyzed = EnterpriseChangeRegistry.transitionState(chg.changeId, "ANALYZING");
    expect(analyzed.status).toBe("ANALYZING");
  });

  it("rejects changes without sourceExecutionId or sourceDecisionId", () => {
    expect(() =>
      EnterpriseChangeRegistry.registerChange({
        projectId: "proj_api",
        organizationId: "org_alpha",
        teamId: "team_core",
        environment: "production",
        sourceExecutionId: "",
        sourceDecisionId: "",
        title: "Deploy Gateway V4",
        affectedFiles: [],
        affectedServices: [],
        affectedDatabases: [],
        dependencies: [],
        riskClassification: "LOW",
        expectedOutcome: "",
        actor: "admin_lead",
      })
    ).toThrow();
  });
});
