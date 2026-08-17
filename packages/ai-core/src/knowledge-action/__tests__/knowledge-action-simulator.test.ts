import { describe, it, expect } from "vitest";
import { KnowledgeActionSimulator } from "../knowledge-action-simulator.js";

describe("AEGIS Phase 43 — Knowledge Action Simulator", () => {
  it("enforces strictly ZERO mutations across source, db, deploy, policy, and auth during simulation", () => {
    const report = KnowledgeActionSimulator.simulateAction("act_fleet_pool", ["proj_gym", "proj_auth", "proj_crm"]);

    expect(report.sourceMutations).toBe(0);
    expect(report.databaseMutations).toBe(0);
    expect(report.deploymentMutations).toBe(0);
    expect(report.policyMutations).toBe(0);
    expect(report.authorizationMutations).toBe(0);
    expect(report.projectedCostSavingsINR).toBeGreaterThan(0);
  });
});
