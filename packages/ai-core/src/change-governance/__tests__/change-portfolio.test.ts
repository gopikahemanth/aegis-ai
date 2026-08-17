import { describe, it, expect } from "vitest";
import { ChangePortfolioEngine } from "../change-portfolio-engine.js";

describe("AEGIS Phase 34 — Change Portfolio Engine", () => {
  it("calculates enterprise change portfolio metrics and success rate", () => {
    const metrics = ChangePortfolioEngine.calculatePortfolioMetrics(100, 96, 4, 2);
    expect(metrics.changeSuccessRatePercentage).toBe(96);
    expect(metrics.changeFailureRatePercentage).toBe(4);
    expect(metrics.rollbackRatePercentage).toBe(2);
  });
});
