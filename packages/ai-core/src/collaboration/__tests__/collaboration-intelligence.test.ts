import { describe, it, expect } from "vitest";
import { CollaborationIntelligenceEngine } from "../collaboration-intelligence.js";

describe("AEGIS Phase 22 — Collaboration Intelligence Engine", () => {
  it("produces recommendations without granting or bypassing authorization", () => {
    const recs = CollaborationIntelligenceEngine.analyzeWorkflowRecommendations("proj_1", true);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].type).toBe("RECOMMEND_ESCALATION");
  });
});
