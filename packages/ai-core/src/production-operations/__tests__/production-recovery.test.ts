import { describe, it, expect } from "vitest";
import { ProductionRecoveryVerifier } from "../production-recovery-verifier.js";

describe("AEGIS Phase 55 — Production Recovery Verifier", () => {
  it("verifies full 4-layer recovery (Health, API, Browser, Workflow)", async () => {
    const report = await ProductionRecoveryVerifier.verify();
    expect(report.isRecovered).toBe(true);
    expect(report.healthPassed).toBe(true);
    expect(report.apiPassed).toBe(true);
    expect(report.browserPassed).toBe(true);
    expect(report.businessWorkflowPassed).toBe(true);
  });

  it("fails recovery when business workflow fails — SERVICE RECOVERED ≠ PRODUCT RECOVERED", async () => {
    const report = await ProductionRecoveryVerifier.verify({ simulateWorkflowFailure: true });
    expect(report.isRecovered).toBe(false);
    expect(report.businessWorkflowPassed).toBe(false);
    expect(report.apiPassed).toBe(true); // API works, but workflow failed
  });
});
