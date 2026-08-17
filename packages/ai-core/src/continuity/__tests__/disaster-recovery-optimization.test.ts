import { describe, it, expect } from "vitest";
import { DisasterRecoveryOptimizer } from "../disaster-recovery-optimizer.js";

describe("AEGIS Phase 28 — Disaster Recovery Optimizer", () => {
  it("recommends RTO reductions when threshold is breached and requires authorization", () => {
    const rec = DisasterRecoveryOptimizer.optimizeRecovery("proj_core", 300, 120);
    expect(rec.action).toBe("REDUCE_RTO");
    expect(rec.authorizationRequired).toBe(true);
    expect(rec.expectedRTOImprovementSeconds).toBe(180);
  });
});
