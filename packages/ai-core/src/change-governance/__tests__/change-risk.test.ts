import { describe, it, expect } from "vitest";
import { ChangeRiskEngine } from "../change-risk-engine.js";

describe("AEGIS Phase 34 — Change Risk Engine", () => {
  it("quantifies risk and strictly forbids governance bypass", () => {
    const report = ChangeRiskEngine.evaluateRisk({
      changeId: "chg_1",
      dependencyCount: 6,
      hasDatabaseMigration: true,
      isSecuritySensitive: true,
      hasRollbackProcedure: true,
      historicalFailureRatePercentage: 15,
    });

    expect(report.riskLevel).toBe("CRITICAL");
    expect(report.governanceBypassAllowed).toBe(false);
  });

  it("blocks change when rollback procedure is missing", () => {
    const report = ChangeRiskEngine.evaluateRisk({
      changeId: "chg_norb",
      dependencyCount: 0,
      hasDatabaseMigration: false,
      isSecuritySensitive: false,
      hasRollbackProcedure: false,
      historicalFailureRatePercentage: 0,
    });

    expect(report.riskLevel).toBe("BLOCKED");
  });
});
