import { describe, it, expect, beforeEach } from "vitest";
import { CostAttributionEngine } from "../cost-attribution-engine.js";

describe("AEGIS Phase 26 — Cost Attribution Engine", () => {
  beforeEach(() => {
    CostAttributionEngine.reset();
  });

  it("records and attributes compute and token costs to project and organization", () => {
    CostAttributionEngine.recordCost({
      organizationId: "org_alpha",
      projectId: "proj_api",
      category: "LLM_TOKENS",
      costType: "VERIFIED_COST",
      amountINR: 15000,
      tokensConsumed: 450000,
    });

    CostAttributionEngine.recordCost({
      organizationId: "org_alpha",
      projectId: "proj_api",
      category: "COMPUTE_WORKER",
      costType: "VERIFIED_COST",
      amountINR: 5000,
      computeHours: 4,
    });

    expect(CostAttributionEngine.getTotalProjectCost("proj_api")).toBe(20000);
    expect(CostAttributionEngine.getCostRecords("org_alpha").length).toBe(2);
  });
});
