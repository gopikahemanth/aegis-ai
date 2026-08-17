import { describe, it, expect } from "vitest";
import { InitiativePrioritizer } from "../initiative-prioritizer.js";

describe("AEGIS Phase 23 — Initiative Prioritizer", () => {
  it("calculates deterministic weighted priority score prioritizing security and compliance", () => {
    const result = InitiativePrioritizer.prioritize(
      {
        initiativeId: "init_1",
        organizationId: "org_alpha",
        name: "Security Token Hardening",
        description: "Hardening token security",
        businessObjective: "Security",
        affectedProjects: ["proj_1"],
        priorityClass: "MEDIUM",
        status: "PROPOSED",
        createdAt: new Date().toISOString(),
      },
      {
        securityImpact: 95,
        complianceUrgency: 90,
        reliabilityImpact: 80,
        businessValue: 70,
        technicalDebtReduction: 60,
      }
    );

    expect(result.priorityClass).toBe("CRITICAL");
    expect(result.score).toBeGreaterThan(80);
    expect(result.reasoning).toContain("Security");
  });
});
