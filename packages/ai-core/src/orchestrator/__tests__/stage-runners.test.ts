import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  RequirementsStageRunner,
  ArchitectureStageRunner,
  PlanningStageRunner,
  FrontendStageRunner,
  BackendStageRunner,
  VerificationStageRunner,
  DeliveryStageRunner,
  type StageContext,
} from "../stages/index.js";
import { JobStateManager } from "../job-state-manager.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_stage_runners");

describe("Modular Stage Runners — Orchestrator Decomposition", () => {
  let context: StageContext;
  let stateManager: JobStateManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });

    stateManager = new JobStateManager(TEST_DIR);
    stateManager.createJob("stage_job_001", "Build full-stack e-commerce store with shopping cart and admin panel");

    context = {
      jobId: "stage_job_001",
      request: "Build full-stack e-commerce store with shopping cart and admin panel",
      outputDirectory: TEST_DIR,
      stateManager,
    };
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("executes the full lifecycle stages in sequence with contract verification", async () => {
    // 1. Requirements Stage
    const reqRunner = new RequirementsStageRunner();
    const reqRes = await reqRunner.execute(context);
    expect(reqRes.success).toBe(true);
    expect(reqRes.targetJobStatus).toBe("PLANNING");
    expect(context.projectSpec).toBeDefined();
    expect(context.projectSpec.type).toBe("ecommerce");
    expect(context.projectSpec.features.length).toBeGreaterThan(0);

    // 2. Architecture Stage
    const archRunner = new ArchitectureStageRunner();
    const archRes = await archRunner.execute(context);
    expect(archRes.success).toBe(true);
    expect(context.architecturePlan).toBeDefined();
    expect(context.architecturePlan.frontend.framework).toBe("react-vite");
    expect(context.architecturePlan.backend.framework).toBe("express");

    // 3. Planning Stage
    const planRunner = new PlanningStageRunner();
    const planRes = await planRunner.execute(context);
    expect(planRes.success).toBe(true);
    expect(context.tasks).toBeDefined();
    expect(context.tasks!.length).toBeGreaterThanOrEqual(4);

    // 4. Frontend Stage
    const feRunner = new FrontendStageRunner();
    const feRes = await feRunner.execute(context);
    expect(feRes.success).toBe(true);
    expect(context.frontendSummary.filesCreated.length).toBeGreaterThan(0);

    // 5. Backend Stage
    const beRunner = new BackendStageRunner();
    const beRes = await beRunner.execute(context);
    expect(beRes.success).toBe(true);
    expect(context.backendSummary.filesCreated.length).toBeGreaterThan(0);

    // 6. Verification Stage
    const verRunner = new VerificationStageRunner();
    const verRes = await verRunner.execute(context);
    expect(verRes.success).toBe(true);
    expect(verRes.targetJobStatus).toBe("VERIFYING");
    expect(context.verificationReport.status).toBe("SUCCESS");

    // 7. Delivery Stage
    const delRunner = new DeliveryStageRunner();
    const delRes = await delRunner.execute(context);
    expect(delRes.success).toBe(true);
    expect(delRes.targetJobStatus).toBe("DELIVERED");
    expect(stateManager.getStatus()).toBe("DELIVERED");

    // Verify envelopes were recorded for all executed stages
    const envelopes = stateManager.getJob()?.envelopes ?? [];
    expect(envelopes.length).toBe(7);
    for (const env of envelopes) {
      expect(env.status).toBe("COMPLETED");
    }
  });

  it("aborts stage cleanly when cancellation token is triggered", async () => {
    context.cancellationToken = { isCancelled: true, reason: "Cancelled by user" };

    const reqRunner = new RequirementsStageRunner();
    const res = await reqRunner.execute(context);

    expect(res.success).toBe(false);
    expect(res.targetJobStatus).toBe("CANCELLED");
    expect(stateManager.isCancelled()).toBe(true);
    expect(stateManager.getStatus()).toBe("CANCELLED");
  });
});
