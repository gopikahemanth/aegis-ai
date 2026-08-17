import { describe, it, expect } from "vitest";
import { EnterpriseCustomerPortfolioEngine } from "../customer-portfolio-engine.js";

describe("AEGIS Phase 38 — Enterprise Customer Portfolio Engine", () => {
  it("calculates enterprise portfolio health and retention rate", () => {
    const summary = EnterpriseCustomerPortfolioEngine.calculatePortfolio(
      50,
      42,
      5,
      2,
      1,
      1200000
    );

    expect(summary.totalCustomers).toBe(50);
    expect(summary.portfolioRetentionRatePct).toBe(94);
    expect(summary.totalVerifiedCustomerValueINR).toBe(1200000);
  });
});
