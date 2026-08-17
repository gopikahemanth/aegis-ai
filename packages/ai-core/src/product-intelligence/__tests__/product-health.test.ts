import { describe, it, expect } from "vitest";
import { ProductHealthEngine } from "../product-health-engine.js";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Product Health Engine", () => {
  it("evaluates evidence-backed health score across 7 product dimensions", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });
    const health = ProductHealthEngine.evaluateHealth(stream);

    expect(health.dimensions.length).toBe(7);
    expect(health.dimensions.some((d) => d.name === "SECURITY" && d.score === 100)).toBe(true);
    expect(health.dimensions.some((d) => d.name === "PERFORMANCE" && d.status === "DEGRADED")).toBe(true);
    expect(health.overallHealthScore).toBeGreaterThanOrEqual(80);
  });
});
