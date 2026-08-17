import { describe, it, expect } from "vitest";
import { InfrastructureHealthEngine } from "../infrastructure-health-engine.js";

describe("AEGIS Phase 54 — Infrastructure Health Engine", () => {
  it("reports HEALTHY status across all 8 infrastructure components", () => {
    const res = InfrastructureHealthEngine.evaluateHealth();
    expect(res.isFullyOperational).toBe(true);
    expect(res.overallStatus).toBe("HEALTHY");
    expect(res.components).toHaveLength(8);
    expect(res.degradedComponents).toHaveLength(0);
    expect(res.criticalComponents).toHaveLength(0);
  });

  it("identifies DEGRADED state when a service component has high latency", () => {
    const res = InfrastructureHealthEngine.evaluateHealth({ simulateDegraded: ["Backend API Service"] });
    expect(res.isFullyOperational).toBe(false);
    expect(res.overallStatus).toBe("DEGRADED");
    expect(res.degradedComponents).toContain("Backend API Service");
  });

  it("identifies CRITICAL state when a component is DOWN", () => {
    const res = InfrastructureHealthEngine.evaluateHealth({ simulateCritical: ["PostgreSQL Database"] });
    expect(res.isFullyOperational).toBe(false);
    expect(res.overallStatus).toBe("CRITICAL");
    expect(res.criticalComponents).toContain("PostgreSQL Database");
  });
});
