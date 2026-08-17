import { describe, it, expect, beforeEach } from "vitest";
import { DecisionPortfolioEngine } from "../decision-portfolio-engine.js";

describe("AEGIS Phase 31 — Decision Portfolio Engine", () => {
  beforeEach(() => {
    DecisionPortfolioEngine.reset();
  });

  it("organizes decisions across organization with priority sorting", () => {
    DecisionPortfolioEngine.addDecision({
      decisionId: "dec_1",
      projectId: "proj_billing",
      title: "Routine Cache Flush",
      priority: "LOW",
      status: "ACTIVE",
      riskScore: 20,
    });

    DecisionPortfolioEngine.addDecision({
      decisionId: "dec_2",
      projectId: "proj_core",
      title: "Failover Primary DB",
      priority: "CRITICAL",
      status: "ACTIVE",
      riskScore: 90,
    });

    const portfolio = DecisionPortfolioEngine.getPortfolio();
    expect(portfolio.length).toBe(2);
    expect(portfolio[0].priority).toBe("CRITICAL");
  });
});
