import { describe, it, expect } from "vitest";
import { PortfolioRebalancer } from "../portfolio-rebalancer.js";
import type { StrategicInitiative } from "../../strategy/strategic-initiative.js";

describe("AEGIS Phase 25 — Portfolio Rebalancing Engine", () => {
  it("proposes initiative rebalancing across horizons without silently dropping initiatives", () => {
    const initiatives: StrategicInitiative[] = [
      {
        initiativeId: "init_sec",
        organizationId: "org_alpha",
        name: "Security Hardening",
        description: "Zero-day patch",
        businessObjective: "Security",
        affectedProjects: ["proj_1"],
        priorityClass: "MEDIUM",
        status: "APPROVED",
        createdAt: new Date().toISOString(),
      },
      {
        initiativeId: "init_perf",
        organizationId: "org_alpha",
        name: "Performance Tuning",
        description: "Speed boost",
        businessObjective: "Speed",
        affectedProjects: ["proj_1"],
        priorityClass: "HIGH",
        status: "APPROVED",
        createdAt: new Date().toISOString(),
      },
    ];

    const overrides = new Map<string, "ACCELERATE" | "DEPRIORITIZE">([
      ["init_sec", "ACCELERATE"],
      ["init_perf", "DEPRIORITIZE"],
    ]);

    const proposal = PortfolioRebalancer.proposeRebalancing("org_alpha", initiatives, overrides);
    expect(proposal.rebalancedInitiatives.length).toBe(2);
    expect(proposal.acceleratedInitiatives).toContain("init_sec");
    expect(proposal.deprioritizedInitiatives).toContain("init_perf");
    expect(proposal.requiresAuthorization).toBe(true);
  });
});
