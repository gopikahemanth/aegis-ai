import { describe, it, expect } from "vitest";
import { EvolutionPortfolioEngine } from "../evolution-portfolio-engine.js";

describe("AEGIS Phase 35 — Evolution Portfolio Engine", () => {
  it("calculates enterprise evolution metrics and success percentage", () => {
    const summary = EvolutionPortfolioEngine.calculatePortfolio(20, 18, 16, 2, 1);
    expect(summary.evolutionSuccessRatePercentage).toBe(89);
    expect(summary.averageRoiRatio).toBe(4.8);
    expect(summary.technicalDebtReductionPercentage).toBe(35);
  });
});
