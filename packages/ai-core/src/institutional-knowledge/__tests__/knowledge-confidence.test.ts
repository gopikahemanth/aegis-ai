import { describe, it, expect } from "vitest";
import { KnowledgeConfidenceEngine } from "../knowledge-confidence-engine.js";

describe("AEGIS Phase 41 — Knowledge Confidence Engine", () => {
  it("evaluates empirical confidence and prevents high confidence from equaling authorization", () => {
    const report = KnowledgeConfidenceEngine.evaluateConfidence("k_item_pool_1", 3, 4, true, false);
    expect(report.confidenceLevel).toBe("VERIFIED");
    expect(report.confidenceScorePct).toBeGreaterThanOrEqual(90);

    const degraded = KnowledgeConfidenceEngine.evaluateConfidence("k_item_pool_1", 1, 0, false, true);
    expect(degraded.confidenceLevel).toBe("LOW");
    expect(degraded.confidenceScorePct).toBeLessThan(50);
  });
});
