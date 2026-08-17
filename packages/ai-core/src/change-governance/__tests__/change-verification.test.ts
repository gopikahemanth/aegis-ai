import { describe, it, expect } from "vitest";
import { ChangeVerificationEngine } from "../change-verification-engine.js";

describe("AEGIS Phase 34 — Change Verification Engine", () => {
  it("verifies changes across Technical, Operational, and Business layers", () => {
    const report = ChangeVerificationEngine.verifyChange({
      changeId: "chg_1",
      buildAndTestsPassed: true,
      apiContractValid: true,
      operationalLatencyHealthy: true,
      businessKpiPreserved: true,
    });

    expect(report.overallPassed).toBe(true);
    expect(report.technicalVerified).toBe(true);
    expect(report.operationalVerified).toBe(true);
    expect(report.businessVerified).toBe(true);
    expect(report.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
