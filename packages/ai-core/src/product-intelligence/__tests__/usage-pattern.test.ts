import { describe, it, expect } from "vitest";
import { UsagePatternEngine } from "../usage-pattern-engine.js";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Usage Pattern Engine", () => {
  it("mines checkout workflow funnels and detects 38% abandonment anomaly", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });
    const report = UsagePatternEngine.analyzePatterns(stream);

    expect(report.hasFrictionPatterns).toBe(true);
    expect(report.primaryAnomaly?.workflowName).toBe("Membership Checkout");
    expect(report.primaryAnomaly?.abandonmentRatePercent).toBe(38);
    expect(report.primaryAnomaly?.deviceBreakdown.mobileAbandonmentPercent).toBe(72);
  });
});
