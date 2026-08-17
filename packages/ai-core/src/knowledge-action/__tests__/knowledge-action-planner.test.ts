import { describe, it, expect } from "vitest";
import { KnowledgeActionPlanner } from "../knowledge-action-planner.js";

describe("AEGIS Phase 43 — Knowledge Action Planner", () => {
  it("converts approved recommendations into structured action plans preserving full lineage", () => {
    const plan = KnowledgeActionPlanner.createPlan(
      "ins_p99_reduction",
      "Fleet-Wide Database Connection Pool Resiliency Plan",
      ["Upgrade pool limits to 50", "Inject telemetry probes"],
      ["proj_gym", "proj_crm"],
      ["Engineering", "Reliability"],
      {
        evidenceIds: ["ev_1", "ev_2"],
        synthesisId: "synth_101",
        insightId: "ins_p99_reduction",
        recommendationId: "rec_adapt_77",
      },
      "MODERATE"
    );

    expect(plan.planId).toBeDefined();
    expect(plan.lineage.insightId).toBe("ins_p99_reduction");
    expect(plan.lineage.recommendationId).toBe("rec_adapt_77");
    expect(plan.verificationCriteria.length).toBeGreaterThanOrEqual(2);
    expect(plan.status).toBe("READY_FOR_REVIEW");
  });
});
