import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DeploymentEngine } from "../deployment-engine.js";

const DEP_ENGINE_DIR = join(process.cwd(), ".tmp_test_p14_dep_engine");

describe("AEGIS Phase 14 — Deployment Preview, Authorization & Verified Rollback", () => {
  beforeEach(() => {
    if (existsSync(DEP_ENGINE_DIR)) rmSync(DEP_ENGINE_DIR, { recursive: true, force: true });
    mkdirSync(DEP_ENGINE_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(DEP_ENGINE_DIR)) rmSync(DEP_ENGINE_DIR, { recursive: true, force: true });
  });

  it("previews deployment with strict 0 disk mutations", () => {
    const preview = DeploymentEngine.previewDeployment(DEP_ENGINE_DIR, "gym_proj", "PRODUCTION");
    expect(preview.diskMutations).toBe(0);
    expect(preview.requiresAuthorization).toBe(true);
  });

  it("blocks unauthorized production deployment and executes rollback upon request", async () => {
    // 1. Deploy without authorization -> AWAITING_AUTHORIZATION
    const unauth = await DeploymentEngine.deploy(DEP_ENGINE_DIR, "gym_proj", "rel_1", "PRODUCTION", false);
    expect(unauth.status).toBe("AWAITING_AUTHORIZATION");

    // 2. Deploy with authorization -> SUCCESS
    const auth1 = await DeploymentEngine.deploy(DEP_ENGINE_DIR, "gym_proj", "rel_1", "PRODUCTION", true);
    expect(auth1.status).toBe("SUCCESS");

    // 3. Deploy release 2
    const auth2 = await DeploymentEngine.deploy(DEP_ENGINE_DIR, "gym_proj", "rel_2", "PRODUCTION", true);
    expect(auth2.status).toBe("SUCCESS");

    // 4. Rollback to release 1
    const rollback = await DeploymentEngine.rollback(DEP_ENGINE_DIR, "gym_proj");
    expect(rollback.success).toBe(true);
    expect(rollback.rolledBackToReleaseId).toBe("rel_1");
  });
});
