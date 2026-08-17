import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DeploymentOrchestrator } from "../deployment-orchestrator.js";
import { DeploymentInventory } from "../deployment-inventory.js";
import { ProductionStateManager } from "../production-state.js";

const ORCH_TEST_DIR = join(process.cwd(), ".tmp_test_p15_orch");

describe("AEGIS Phase 15 — Governed Deployment Orchestration", () => {
  beforeEach(() => {
    if (existsSync(ORCH_TEST_DIR)) rmSync(ORCH_TEST_DIR, { recursive: true, force: true });
    mkdirSync(ORCH_TEST_DIR, { recursive: true });
    DeploymentInventory.reset();
    ProductionStateManager.reset();
  });

  afterEach(() => {
    if (existsSync(ORCH_TEST_DIR)) rmSync(ORCH_TEST_DIR, { recursive: true, force: true });
  });

  it("requires authorization for production and succeeds when authorized", async () => {
    // 1. Unauthorized attempt
    const unauth = await DeploymentOrchestrator.executeDeployment({
      projectId: "gym_proj",
      projectPath: ORCH_TEST_DIR,
      environment: "production",
      releaseId: "rel_101",
      generationId: "gen_1",
      isAuthorized: false,
    });
    expect(unauth.status).toBe("AWAITING_AUTHORIZATION");

    // 2. Authorized execution
    const auth = await DeploymentOrchestrator.executeDeployment({
      projectId: "gym_proj",
      projectPath: ORCH_TEST_DIR,
      environment: "production",
      releaseId: "rel_101",
      generationId: "gen_1",
      isAuthorized: true,
    });
    expect(auth.status).toBe("COMPLETED");
    expect(DeploymentInventory.getActiveDeployment("gym_proj", "production")?.releaseId).toBe("rel_101");
  });

  it("detects release version mismatch when running server differs from expected release", async () => {
    const mismatch = await DeploymentOrchestrator.executeDeployment({
      projectId: "gym_proj",
      projectPath: ORCH_TEST_DIR,
      environment: "staging",
      releaseId: "rel_102",
      generationId: "gen_2",
      actualRunningReleaseId: "rel_101", // Version mismatch
      isAuthorized: true,
    });

    expect(mismatch.status).toBe("FAILED");
    expect(mismatch.error).toContain("DEPLOYMENT_VERSION_MISMATCH");
  });
});
