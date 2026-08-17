import { describe, it, expect } from "vitest";
import { KnowledgePortfolioEngine } from "../knowledge-portfolio-engine.js";

describe("AEGIS Phase 41 — Knowledge Portfolio Engine", () => {
  it("computes comprehensive portfolio health and visibility metrics", () => {
    const summary = KnowledgePortfolioEngine.calculatePortfolio("org_global", 60, 52, 14, 2, 1);
    expect(summary.totalKnowledgeItemsCount).toBe(60);
    expect(summary.verifiedKnowledgeItemsCount).toBe(52);
    expect(summary.knowledgeHealthScore).toBeGreaterThanOrEqual(80);
  });
});
