import { describe, it, expect } from "vitest";
import { ImprovementImpactEngine } from "../improvement-impact-engine.js";

describe("AEGIS Phase 60 — Improvement Impact Engine", () => {
  it("quantifies real-world business impact (+12% checkout conversion uplift)", () => {
    const impact = ImprovementImpactEngine.measureImpact();
    expect(impact.isImpactPositive).toBe(true);
    expect(impact.conversionUpliftPercent).toBe(12);
    expect(impact.latencyReductionPercent).toBe(82);
    expect(impact.comparisons.length).toBe(4);
  });

  it("detects when post-deployment impact is negative", () => {
    const impact = ImprovementImpactEngine.measureImpact({
      simulateDegradedImpact: true,
    });
    expect(impact.isImpactPositive).toBe(false);
    expect(impact.conversionUpliftPercent).toBe(-4);
  });
});
