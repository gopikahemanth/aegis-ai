import { describe, it, expect } from "vitest";
import { ProductionDependencyMonitor } from "../production-dependency-monitor.js";

describe("AEGIS Phase 55 — Production Dependency Monitor", () => {
  it("reports all external integrations AVAILABLE under normal conditions", () => {
    const report = ProductionDependencyMonitor.checkDependencies();
    expect(report.allAvailable).toBe(true);
    expect(report.overallState).toBe("AVAILABLE");
    expect(report.dependencies.length).toBeGreaterThanOrEqual(4);
  });

  it("detects payment outage and reports business impact", () => {
    const report = ProductionDependencyMonitor.checkDependencies({ simulatePaymentFailure: true });
    expect(report.allAvailable).toBe(false);
    expect(report.overallState).toBe("FAILED");
    const stripe = report.dependencies.find((d) => d.name.includes("Stripe"));
    expect(stripe?.state).toBe("FAILED");
    expect(stripe?.businessImpact).toContain("checkout");
  });
});
