import { describe, it, expect } from "vitest";
import { ProductSignalCorrelationEngine } from "../product-signal-correlation-engine.js";
import { UsagePatternEngine } from "../usage-pattern-engine.js";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Product Signal Correlation Engine", () => {
  it("correlates mobile abandonment with 2,100ms API latency as a verified problem", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });
    const patterns = UsagePatternEngine.analyzePatterns(stream);
    const correlation = ProductSignalCorrelationEngine.correlateSignals(stream, patterns);

    expect(correlation.hasCorrelatedProblems).toBe(true);
    expect(correlation.strongestSignalGroup?.strength).toBe("VERIFIED_PROBLEM");
    expect(correlation.strongestSignalGroup?.confidence).toBe(0.95);
  });

  it("identifies scheduled maintenance as weak signal without modifying product", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: false,
      simulateMaintenanceAnomaly: true,
    });
    const patterns = UsagePatternEngine.analyzePatterns(stream);
    const correlation = ProductSignalCorrelationEngine.correlateSignals(stream, patterns);

    expect(correlation.hasCorrelatedProblems).toBe(false);
    expect(correlation.hasInsufficientEvidenceForModification).toBe(true);
  });
});
