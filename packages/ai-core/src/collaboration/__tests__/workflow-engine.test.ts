import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseWorkflowEngine } from "../workflow-engine.js";

describe("AEGIS Phase 22 — Enterprise Workflow Engine", () => {
  beforeEach(() => {
    EnterpriseWorkflowEngine.reset();
  });

  it("creates and transitions long-running enterprise workflows through governed states", () => {
    const wf = EnterpriseWorkflowEngine.createWorkflow({
      workflowId: "wf_api_v2",
      organizationId: "org_global",
      projectId: "proj_api",
      environment: "staging",
      title: "API v2 Rollout",
    });

    expect(wf.state).toBe("CREATED");

    EnterpriseWorkflowEngine.transitionState("wf_api_v2", "EXECUTING");
    expect(EnterpriseWorkflowEngine.getWorkflow("wf_api_v2")?.state).toBe("EXECUTING");

    EnterpriseWorkflowEngine.transitionState("wf_api_v2", "COMPLETED");
    expect(EnterpriseWorkflowEngine.getWorkflow("wf_api_v2")?.state).toBe("COMPLETED");
  });
});
