import { describe, it, expect } from "vitest";
import { DeploymentRollbackEngine } from "../deployment-rollback-engine.js";

describe("AEGIS Phase 53 — Deployment Rollback Engine", () => {
  it("completes rollback through all stages and verifies safe state — ROLLBACK_EXECUTED ≠ ROLLBACK_VERIFIED", async () => {
    const r = await DeploymentRollbackEngine.rollback("dep_test", "v1.0.0-stable");
    expect(r.finalState).toBe("ROLLBACK_COMPLETED");
    expect(r.isRollbackVerified).toBe(true);
    expect(r.previousVersionRestored).toBe(true);
    expect(r.healthVerified).toBe(true);
    expect(r.smokeTestPassed).toBe(true);
    expect(r.safeState).toBe(true);
    expect(r.steps.some((s) => s.state === "PREVIOUS_VERSION_RESTORED")).toBe(true);
    expect(r.steps.some((s) => s.state === "SMOKE_TEST_VERIFIED")).toBe(true);
  });

  it("detects rollback failure and requires manual intervention", async () => {
    const r = await DeploymentRollbackEngine.rollback("dep_fail", "v1.0.0-stable", true);
    expect(r.finalState).toBe("ROLLBACK_FAILED");
    expect(r.isRollbackVerified).toBe(false);
    expect(r.safeState).toBe(false);
  });
});
