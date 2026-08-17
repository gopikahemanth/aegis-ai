import { describe, it, expect } from "vitest";
import { DeploymentExecutor } from "../deployment-executor.js";
import { DeploymentPlanEngine } from "../deployment-plan-engine.js";

describe("AEGIS Phase 53 — Deployment Executor", () => {
  it("completes deployment through all stages and only reports COMPLETED after post-validation", async () => {
    const plan = DeploymentPlanEngine.createPlan("AegisGymPro");
    const r = await DeploymentExecutor.execute(plan);
    expect(r.isCompleted).toBe(true);
    expect(r.finalStage).toBe("COMPLETED");
    expect(r.isFailed).toBe(false);
    expect(r.stages.some((s) => s.stage === "HEALTH_CHECKING")).toBe(true);
    expect(r.stages.some((s) => s.stage === "VERIFYING")).toBe(true);
  });

  it("reports FAILED and NOT COMPLETED when a stage fails — DEPLOYMENT SUCCESS ≠ LIVE WEBSITE HEALTH", async () => {
    const plan = DeploymentPlanEngine.createPlan("AegisGymPro");
    const r = await DeploymentExecutor.execute(plan, "MIGRATING");
    expect(r.isFailed).toBe(true);
    expect(r.isCompleted).toBe(false);
    expect(r.finalStage).toBe("FAILED");
  });
});
