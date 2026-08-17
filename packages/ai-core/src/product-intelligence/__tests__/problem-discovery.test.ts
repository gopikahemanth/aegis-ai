import { describe, it, expect } from "vitest";
import { ProblemDiscoveryEngine } from "../problem-discovery-engine.js";
import { ProductSignalCorrelationEngine } from "../product-signal-correlation-engine.js";
import { UsagePatternEngine } from "../usage-pattern-engine.js";
import { ProductObservationEngine } from "../product-observation-engine.js";

describe("AEGIS Phase 60 — Problem Discovery Engine", () => {
  it("discovers verified business workflow problem with isolated root cause", () => {
    const stream = ProductObservationEngine.collectObservations("GymMaster Pro", {
      simulateCheckoutBottleneck: true,
    });
    const patterns = UsagePatternEngine.analyzePatterns(stream);
    const correlation = ProductSignalCorrelationEngine.correlateSignals(stream, patterns);
    const discovery = ProblemDiscoveryEngine.discoverProblems(correlation);

    expect(discovery.hasProblems).toBe(true);
    expect(discovery.totalProblems).toBe(1);
    expect(discovery.primaryProblem?.category).toBe("BUSINESS_WORKFLOW_PROBLEM");
    expect(discovery.primaryProblem?.severity).toBe("P1_HIGH");
    expect(discovery.primaryProblem?.rootCause).toContain("PaymentService");
  });
});
