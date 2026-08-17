import { describe, it, expect } from "vitest";
import { KnowledgeConflictEngine } from "../knowledge-conflict-engine.js";

describe("AEGIS Phase 41 — Knowledge Conflict Engine", () => {
  it("detects contradictory knowledge and flags human review without automatic resolution", () => {
    const report = KnowledgeConflictEngine.detectConflict(
      "k_1",
      "Redis caching improved latency across API endpoints",
      "k_2",
      "Redis caching increased latency under bursty write workloads"
    );

    expect(report.conflictType).toBe("DIRECT_CONTRADICTION");
    expect(report.requiresHumanReview).toBe(true);
  });
});
