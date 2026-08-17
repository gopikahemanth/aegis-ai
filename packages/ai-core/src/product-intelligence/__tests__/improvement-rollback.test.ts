import { describe, it, expect } from "vitest";
import { ImprovementRollbackEngine } from "../improvement-rollback-engine.js";

describe("AEGIS Phase 60 — Improvement Rollback Engine", () => {
  it("restores pre-mutation snapshot and verifies post-rollback health", async () => {
    const result = await ImprovementRollbackEngine.executeRollback("chkpt_imp_test_123");
    expect(result.isRolledBack).toBe(true);
    expect(result.isRollbackVerified).toBe(true);
    expect(result.postRollbackHealthVerified).toBe(true);
    expect(result.businessWorkflowRestored).toBe(true);
  });

  it("fails verification when post-rollback health is compromised", async () => {
    const result = await ImprovementRollbackEngine.executeRollback("chkpt_imp_test_123", {
      simulateRollbackVerificationFailure: true,
    });
    expect(result.isRolledBack).toBe(true);
    expect(result.isRollbackVerified).toBe(false);
  });
});
