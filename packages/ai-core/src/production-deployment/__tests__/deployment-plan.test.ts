import { describe, it, expect } from "vitest";
import { DeploymentPlanEngine } from "../deployment-plan-engine.js";

describe("AEGIS Phase 53 — Deployment Plan Engine", () => {
  it("generates a complete deployment plan with rollback strategy BEFORE execution", () => {
    const plan = DeploymentPlanEngine.createPlan("AegisGymPro", "LOCAL");
    expect(plan.planId).toBeDefined();
    expect(plan.buildCommand).toContain("pnpm");
    expect(plan.migrationCommand).toContain("prisma");
    expect(plan.rollbackStrategy).toBe("PREVIOUS_BUILD_RESTORE");
    expect(plan.rollbackCommand).toBeDefined();
    expect(plan.healthChecks.length).toBeGreaterThan(0);
    expect(plan.smokeTests.length).toBeGreaterThan(0);
    expect(plan.approvedAt).toBeDefined();
  });

  it("includes required environment variables in the plan", () => {
    const plan = DeploymentPlanEngine.createPlan("AegisGymPro", "LOCAL", ["DATABASE_URL", "JWT_SECRET"]);
    expect(plan.requiredEnvironment).toContain("DATABASE_URL");
    expect(plan.requiredEnvironment).toContain("JWT_SECRET");
  });
});
