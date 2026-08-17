import { describe, it, expect } from "vitest";
import { EnterpriseInsightPortfolioEngine } from "../enterprise-insight-portfolio.js";

describe("AEGIS Phase 42 — Enterprise Insight Portfolio Engine", () => {
  it("calculates enterprise insight portfolio metrics and score", () => {
    const summary = EnterpriseInsightPortfolioEngine.calculatePortfolioSummary(
      "org_global",
      18,
      14,
      2,
      6,
      3
    );

    expect(summary.totalInsightsCount).toBe(18);
    expect(summary.verifiedInsightsCount).toBe(14);
    expect(summary.systemicOpportunitiesCount).toBe(6);
    expect(summary.portfolioIntelligenceScore).toBeGreaterThanOrEqual(75);
  });
});
