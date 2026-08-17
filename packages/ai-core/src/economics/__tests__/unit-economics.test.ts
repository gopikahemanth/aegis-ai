import { describe, it, expect } from "vitest";
import { EngineeringUnitEconomicsEngine } from "../engineering-unit-economics.js";

describe("AEGIS Phase 26 — Engineering Unit Economics Engine", () => {
  it("calculates cost per feature, release, and generation", () => {
    const summary = EngineeringUnitEconomicsEngine.calculateUnitEconomics({
      projectId: "proj_core",
      totalCost: 100000,
      featuresCount: 5,
      releasesCount: 2,
      generationsCount: 4,
      outcomesCount: 1,
    });

    expect(summary.costPerFeatureINR).toBe(20000);
    expect(summary.costPerReleaseINR).toBe(50000);
    expect(summary.costPerGenerationINR).toBe(25000);
    expect(summary.costPerVerifiedOutcomeINR).toBe(100000);
  });
});
