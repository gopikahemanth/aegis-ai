import { describe, it, expect } from "vitest";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Product Observation Engine", () => {
  it("collects runtime telemetry, user funnel metrics, and API latency observations", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });

    expect(stream.totalObservations).toBeGreaterThanOrEqual(4);
    expect(stream.observations.some((o) => o.feature === "Membership Checkout")).toBe(true);
    const apiObs = stream.observations.find((o) => o.type === "API_METRIC");
    expect(apiObs?.value).toBe(2100);
  });
});
