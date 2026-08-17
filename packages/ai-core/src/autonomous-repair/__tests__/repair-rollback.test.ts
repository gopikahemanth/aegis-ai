import { describe, it, expect } from "vitest";
import { RepairRollbackEngine } from "../repair-rollback-engine.js";

describe("AEGIS Phase 57 — Repair Rollback Engine", () => {
  it("rolls back safely and verifies that core workflows are restored", async () => {
    const result = await RepairRollbackEngine.executeRollback("chkpt_01");
    expect(result.isRollbackVerified).toBe(true);
    expect(result.databaseStateVerified).toBe(true);
    expect(result.liveWorkflowsVerified).toBe(true);
  });

  it("enforces ROLLBACK EXECUTED ≠ ROLLBACK VERIFIED when post-rollback workflow fails", async () => {
    const result = await RepairRollbackEngine.executeRollback("chkpt_01", {
      simulateRollbackVerificationFailure: true,
    });
    expect(result.isRollbackVerified).toBe(false);
    expect(result.databaseStateVerified).toBe(true);
  });
});
