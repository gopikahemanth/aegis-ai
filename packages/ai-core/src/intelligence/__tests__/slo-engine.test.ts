import { describe, it, expect } from "vitest";
import { SloEngine } from "../slo-engine.js";

describe("AEGIS Phase 16 — SLO / SLA Reliability Engine", () => {
  it("evaluates healthy SLO compliance and calculates remaining error budget", () => {
    const report = SloEngine.evaluate("gym_proj", {
      availabilityPercent: 99.99,
      apiSuccessPercent: 99.9,
      p95LatencyMs: 120,
    });

    expect(report.overallStatus).toBe("HEALTHY");
    expect(report.isDeploymentBlocked).toBe(false);
    expect(report.slos.every((s) => s.status === "HEALTHY")).toBe(true);
  });

  it("detects SLO breach and blocks deployment when error budget is exhausted", () => {
    const report = SloEngine.evaluate("gym_proj", {
      availabilityPercent: 94.2, // severe breach
    });

    expect(report.overallStatus).toBe("BREACHED");
    expect(report.isDeploymentBlocked).toBe(true);
  });
});
