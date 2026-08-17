import { describe, it, expect } from "vitest";
import { AdaptiveIntelligenceEngine } from "../adaptive-intelligence-engine.js";

describe("AEGIS Phase 42 — Adaptive Intelligence Recommendation Engine", () => {
  it("converts validated insights into governed recommendations requiring human review", () => {
    const rec = AdaptiveIntelligenceEngine.recommendAction(
      "ins_123",
      "STANDARDIZE",
      "Standardize connection pool limits across all 12 microservices",
      ["proj_gym", "proj_auth", "proj_billing"]
    );

    expect(rec.recommendationId).toBeDefined();
    expect(rec.recommendedAction).toBe("STANDARDIZE");
    expect(rec.requiresHumanReview).toBe(true);
    expect(rec.targetProjects.length).toBe(3);
  });
});
