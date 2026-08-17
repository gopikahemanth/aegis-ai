import { describe, it, expect } from "vitest";
import { InfrastructureRollbackEngine } from "../infrastructure-rollback-engine.js";

describe("AEGIS Phase 54 — Infrastructure Rollback Engine", () => {
  it("executes multi-stage rollback and achieves ROLLBACK_VERIFIED state", async () => {
    const res = await InfrastructureRollbackEngine.executeRollback("inf_dep_123", "v1.0.0-stable");
    expect(res.isRollbackVerified).toBe(true);
    expect(res.finalState).toBe("ROLLBACK_VERIFIED");
    expect(res.healthVerified).toBe(true);
    expect(res.publicAvailabilityVerified).toBe(true);
    expect(res.smokeTestsVerified).toBe(true);
    expect(res.stages.some((s) => s.stage === "ROLLBACK_EXECUTED")).toBe(true);
    expect(res.stages.some((s) => s.stage === "ROLLBACK_VERIFIED")).toBe(true);
  });

  it("fails when post-rollback verification fails — ROLLBACK_EXECUTED ≠ ROLLBACK_VERIFIED", async () => {
    const res = await InfrastructureRollbackEngine.executeRollback("inf_dep_123", "v1.0.0-stable", {
      simulateVerificationFailure: true,
    });
    expect(res.isRollbackVerified).toBe(false);
    expect(res.finalState).toBe("ROLLBACK_FAILED");
  });
});
