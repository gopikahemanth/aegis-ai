import { describe, it, expect, beforeEach } from "vitest";
import { ResourceGovernanceEngine } from "../resource-governance-engine.js";

describe("AEGIS Phase 26 — Resource Governance Engine", () => {
  beforeEach(() => {
    ResourceGovernanceEngine.reset();
  });

  it("evaluates budget consumption and flags BUDGET_EXCEEDED when limit is surpassed", () => {
    ResourceGovernanceEngine.setBudget("proj_alpha", 50000);

    const normal = ResourceGovernanceEngine.evaluateBudget("org_1", "proj_alpha", 25000);
    expect(normal.status).toBe("NORMAL");

    const exceeded = ResourceGovernanceEngine.evaluateBudget("org_1", "proj_alpha", 60000);
    expect(exceeded.status).toBe("BUDGET_EXCEEDED");
    expect(exceeded.consumptionRate).toBe(120);
  });
});
