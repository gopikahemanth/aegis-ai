import { describe, it, expect } from "vitest";
import { KnowledgeContradictionEngine } from "../knowledge-contradiction-engine.js";

describe("AEGIS Phase 44 — Knowledge Contradiction Engine", () => {
  it("identifies conflicting claims without automatically deleting historical evidence", () => {
    const report = KnowledgeContradictionEngine.detectContradiction(
      "les_a",
      "Scaling workers resolved latency issues during peak traffic.",
      ["ev_1"],
      "les_b",
      "Scaling workers increased database contention and caused failure.",
      ["ev_2"],
      ["Engineering", "Reliability"]
    );

    expect(report.status).toBe("CONFIRMED_CONTRADICTION");
    expect(report.severity).toBe("HIGH");
    expect(report.claimA.evidenceIds).toContain("ev_1");
    expect(report.claimB.evidenceIds).toContain("ev_2");
    expect(report.recommendedAction).toContain("review");
  });
});
