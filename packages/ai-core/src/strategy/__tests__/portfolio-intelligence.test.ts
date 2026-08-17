import { describe, it, expect, beforeEach } from "vitest";
import { PortfolioIntelligenceEngine } from "../portfolio-intelligence.js";

describe("AEGIS Phase 23 — Portfolio Intelligence Engine", () => {
  beforeEach(() => {
    PortfolioIntelligenceEngine.reset();
  });

  it("aggregates strategic reliability, security, and technical debt across managed projects", () => {
    PortfolioIntelligenceEngine.recordProjectMetrics("org_acme", {
      projectId: "proj_api",
      reliabilityScore: 99,
      securityScore: 100,
      technicalDebtScore: 12,
      complianceScore: 100,
      strategicImportance: "TIER_1_CRITICAL",
    });

    PortfolioIntelligenceEngine.recordProjectMetrics("org_acme", {
      projectId: "proj_web",
      reliabilityScore: 98,
      securityScore: 95,
      technicalDebtScore: 20,
      complianceScore: 100,
      strategicImportance: "TIER_2_CORE",
    });

    const portfolio = PortfolioIntelligenceEngine.analyzePortfolio("org_acme");
    expect(portfolio.projects.length).toBe(2);
    expect(portfolio.averageReliability).toBeGreaterThanOrEqual(98);
    expect(portfolio.overallStrategicHealth).toBe("STABLE");
  });
});
