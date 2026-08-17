import { describe, it, expect } from "vitest";
import { InnovationPortfolioEngine } from "../innovation-portfolio-engine.js";

describe("AEGIS Phase 36 — Innovation Portfolio Engine", () => {
  it("calculates enterprise innovation portfolio metrics and value realization rate", () => {
    const summary = InnovationPortfolioEngine.calculatePortfolio(
      15,
      2,
      12,
      10,
      1000000,
      950000,
      150000
    );

    expect(summary.completedInnovationsCount).toBe(10);
    expect(summary.totalVerifiedValueINR).toBe(950000);
    expect(summary.portfolioRoi).toBe(6.33);
    expect(summary.realizationRatePercentage).toBe(95);
  });
});
