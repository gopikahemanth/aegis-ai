import { describe, it, expect } from "vitest";
import { ProductEvolutionRollbackEngine } from "../product-evolution-rollback-engine.js";

describe("AEGIS Phase 56 — Product Evolution Rollback Engine", () => {
  it("safely rolls back to previous version and verifies core workflows", async () => {
    const result = await ProductEvolutionRollbackEngine.executeRollback("v1.0.0-prod");
    expect(result.isRollbackVerified).toBe(true);
    expect(result.previousVersionRestored).toBe("v1.0.0-prod");
    expect(result.databaseSnapshotRestored).toBe(true);
    expect(result.existingWorkflowsVerified).toBe(true);
  });

  it("enforces ROLLBACK_EXECUTED ≠ ROLLBACK_VERIFIED when post-rollback workflow fails", async () => {
    const result = await ProductEvolutionRollbackEngine.executeRollback("v1.0.0-prod", {
      simulateVerificationFailure: true,
    });
    expect(result.isRollbackVerified).toBe(false);
    expect(result.databaseSnapshotRestored).toBe(true);
  });
});
