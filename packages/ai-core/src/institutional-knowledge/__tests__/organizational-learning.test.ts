import { describe, it, expect } from "vitest";
import { OrganizationalLearningEngine } from "../organizational-learning-engine.js";

describe("AEGIS Phase 41 — Organizational Learning Engine", () => {
  it("generates governed learning recommendations requiring human review", () => {
    const rec = OrganizationalLearningEngine.generateRecommendation(
      "org_global",
      "Update Database Connection Pool Runbook",
      "RUNBOOK_UPDATE",
      "Historical data shows 3 connection starvation incidents resolved by pool resizing to 50.",
      ["k_pool_1", "k_pool_2"]
    );

    expect(rec.recommendationId).toBeDefined();
    expect(rec.category).toBe("RUNBOOK_UPDATE");
    expect(rec.requiresHumanReview).toBe(true);
  });
});
