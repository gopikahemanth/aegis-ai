import { describe, it, expect } from "vitest";
import { ContinuousLearningEngine } from "../continuous-learning-engine.js";

describe("AEGIS Phase 60 — Continuous Learning Engine", () => {
  it("maintains long-term knowledge base with verified enhancements and dangerous anti-patterns", () => {
    const kb = ContinuousLearningEngine.getKnowledgeBase();
    expect(kb.length).toBeGreaterThanOrEqual(2);
    expect(kb.some((k) => k.type === "VERIFIED_ENHANCEMENT")).toBe(true);
    expect(kb.some((k) => k.type === "DANGEROUS_OPTIMIZATION")).toBe(true);
  });

  it("records new learnings dynamically", () => {
    const record = ContinuousLearningEngine.recordLearning({
      topic: "Mobile Viewport Modal Render Test",
      type: "VERIFIED_ENHANCEMENT",
      description: "Fast hydration pattern prevents modal jitter on low-end mobile devices",
      evidenceReference: "Phase 60 E2E Verification",
    });

    expect(record.id).toContain("learn_");
    expect(ContinuousLearningEngine.getKnowledgeBase().some((k) => k.id === record.id)).toBe(true);
  });
});
