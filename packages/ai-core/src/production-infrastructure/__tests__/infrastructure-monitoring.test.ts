import { describe, it, expect } from "vitest";
import { InfrastructureMonitoringEngine } from "../infrastructure-monitoring-engine.js";

describe("AEGIS Phase 54 — Infrastructure Monitoring Engine", () => {
  it("polls real-time metrics and reports HEALTHY baseline status", () => {
    const res = InfrastructureMonitoringEngine.pollMetrics();
    expect(res.isMonitoringActive).toBe(true);
    expect(res.overallStatus).toBe("HEALTHY");
    expect(res.metrics.length).toBeGreaterThanOrEqual(5);
    expect(res.errorRatePercentage).toBeLessThan(0.5);
  });

  it("detects CRITICAL alert status when error rate spikes", () => {
    const res = InfrastructureMonitoringEngine.pollMetrics({ simulateHighErrorRate: true });
    expect(res.overallStatus).toBe("CRITICAL");
  });
});
