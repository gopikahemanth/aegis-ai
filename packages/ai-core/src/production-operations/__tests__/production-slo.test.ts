import { describe, it, expect } from "vitest";
import { ProductionSLOEngine } from "../production-slo-engine.js";

describe("AEGIS Phase 55 — Production SLO Engine", () => {
  it("verifies 4 core SLO targets are compliant and healthy", () => {
    const report = ProductionSLOEngine.evaluateSLOs();
    expect(report.isCompliant).toBe(true);
    expect(report.overallStatus).toBe("SLO_HEALTHY");
    expect(report.objectives).toHaveLength(4);
    expect(report.breachedCount).toBe(0);
  });

  it("detects SLO breach when latency or error budget is depleted", () => {
    const report = ProductionSLOEngine.evaluateSLOs({ simulateBreach: true });
    expect(report.isCompliant).toBe(false);
    expect(report.overallStatus).toBe("SLO_BREACHED");
    expect(report.breachedCount).toBeGreaterThanOrEqual(1);
  });
});
