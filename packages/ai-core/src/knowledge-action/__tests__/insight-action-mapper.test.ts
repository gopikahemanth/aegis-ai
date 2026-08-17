import { describe, it, expect } from "vitest";
import { InsightActionMapper } from "../insight-action-mapper.js";

describe("AEGIS Phase 43 — Insight-to-Action Mapper", () => {
  it("enforces INSIGHT != ACTION and creates governed action proposal with authorization requirements", () => {
    const proposal = InsightActionMapper.mapInsightToAction(
      "ins_p99_reduction",
      "STANDARDIZE",
      "Standardize connection pool size across all fleet nodes",
      "Enforce maximum pool size of 50 in base service template",
      ["ev_postmortem_401", "ev_latency_metrics"],
      ["Engineering", "Reliability"],
      ["proj_gym", "proj_auth"],
      "+50% P99 latency stabilization",
      "MODERATE"
    );

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.actionClass).toBe("STANDARDIZE");
    expect(proposal.authorizationRequirement).toBe("REQUIRES_AUTHORIZATION");
    expect(proposal.affectedProjects.length).toBe(2);
  });
});
