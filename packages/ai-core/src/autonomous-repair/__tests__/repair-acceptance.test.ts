import { describe, it, expect } from "vitest";
import { RepairAcceptanceEngine } from "../repair-acceptance-engine.js";

const allPassCriteria = {
  failureReproduced: true,
  rootCauseIdentified: true,
  repairApplied: true,
  bugNoLongerReproduces: true,
  buildPasses: true,
  regressionTestsPass: true,
  affectedWorkflowsPass: true,
  browserVerificationPasses: true,
  liveVerificationPasses: true,
  criticalDefects: 0,
};

describe("AEGIS Phase 57 — Repair Acceptance Engine", () => {
  it("accepts repair when all 10 criteria pass with zero critical defects", () => {
    const res = RepairAcceptanceEngine.evaluate(allPassCriteria);
    expect(res.isAccepted).toBe(true);
    expect(res.overallScore).toBe(100);
    expect(res.totalCriteria).toBe(10);
    expect(res.passedCriteria).toBe(10);
    expect(res.blockedBy).toHaveLength(0);
  });

  it("rejects repair when regression tests fail", () => {
    const res = RepairAcceptanceEngine.evaluate({
      ...allPassCriteria,
      regressionTestsPass: false,
      criticalDefects: 1,
    });
    expect(res.isAccepted).toBe(false);
    expect(res.blockedBy.some((c) => c.name.includes("Regression"))).toBe(true);
  });
});
