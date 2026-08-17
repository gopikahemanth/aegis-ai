import { describe, it, expect, beforeEach } from "vitest";
import { PortfolioManager } from "../portfolio-manager.js";

describe("AEGIS Phase 21 — Enterprise Portfolio Management", () => {
  beforeEach(() => {
    PortfolioManager.reset();
  });

  it("tracks multi-project portfolio health and flags blocked projects", () => {
    PortfolioManager.trackProject("org_corp", {
      projectId: "proj_1",
      name: "Project 1",
      health: "HEALTHY",
      securityStatus: "CERTIFIED",
    });

    PortfolioManager.trackProject("org_corp", {
      projectId: "proj_2",
      name: "Project 2",
      health: "BLOCKED",
      securityStatus: "AUDITING",
    });

    const portfolio = PortfolioManager.getPortfolio("org_corp");
    expect(portfolio.projects.length).toBe(2);
    expect(portfolio.overallStatus).toBe("ACTION_REQUIRED");
  });
});
