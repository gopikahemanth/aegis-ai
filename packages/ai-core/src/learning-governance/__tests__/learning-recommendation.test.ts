import { describe, it, expect } from "vitest";
import { LearningRecommendationEngine } from "../learning-recommendation-engine.js";

describe("AEGIS Phase 44 — Learning Recommendation Engine", () => {
  it("generates governed learning recommendations requiring explicit authorization", () => {
    const rec = LearningRecommendationEngine.recommend(
      "REVIEW_CONTRADICTION",
      "ctrd_1",
      "Conflicting connection pool guidelines",
      ["ev_1", "ev_2"],
      ["Engineering", "Reliability"]
    );

    expect(rec.recommendationId).toBeDefined();
    expect(rec.type).toBe("REVIEW_CONTRADICTION");
    expect(rec.authorizationRequirement).toBe("REQUIRES_MULTI_ROLE_REVIEW");
  });
});
