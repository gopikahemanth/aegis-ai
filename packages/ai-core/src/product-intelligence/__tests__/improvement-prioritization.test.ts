import { describe, it, expect } from "vitest";
import { ImprovementPrioritizationEngine } from "../improvement-prioritization-engine.js";
import { ProblemDiscoveryEngine } from "../problem-discovery-engine.js";
import { ProductSignalCorrelationEngine } from "../product-signal-correlation-engine.js";
import { UsagePatternEngine } from "../usage-pattern-engine.js";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Improvement Prioritization Engine", () => {
  it("prioritizes checkout abandonment as P1_HIGH based on business & user impact", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });
    const patterns = UsagePatternEngine.analyzePatterns(stream);
    const correlation = ProductSignalCorrelationEngine.correlateSignals(stream, patterns);
    const discovery = ProblemDiscoveryEngine.discoverProblems(correlation);
    const prioritization = ImprovementPrioritizationEngine.prioritize(discovery);

    expect(prioritization.totalRanked).toBe(1);
    expect(prioritization.topPriorityItem?.priorityTier).toBe("P1_HIGH");
    expect(prioritization.topPriorityItem?.businessImpactScore).toBeGreaterThanOrEqual(90);
  });
});
