import { describe, it, expect } from "vitest";
import { ProductionHealthMonitor } from "../production-health-monitor.js";
import { ProductionStateManager } from "../production-state.js";

describe("AEGIS Phase 15 — Continuous Health Monitoring", () => {
  it("evaluates nominal health probes as HEALTHY", async () => {
    ProductionStateManager.reset();
    const report = await ProductionHealthMonitor.evaluateHealth("gym_proj", "production", "http://127.0.0.1:42173");
    expect(report.overallStatus).toBe("HEALTHY");
    expect(report.checks.length).toBe(6);
  });

  it("classifies injected database failure as UNAVAILABLE", async () => {
    ProductionStateManager.reset();
    const report = await ProductionHealthMonitor.evaluateHealth(
      "gym_proj",
      "production",
      "http://127.0.0.1:42173",
      "DB_DOWN"
    );
    expect(report.overallStatus).toBe("UNAVAILABLE");
    expect(report.checks.some((c) => c.component === "DATABASE" && c.status === "UNAVAILABLE")).toBe(true);
  });
});
