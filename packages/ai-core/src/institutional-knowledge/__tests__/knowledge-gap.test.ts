import { describe, it, expect } from "vitest";
import { KnowledgeGapEngine } from "../knowledge-gap-engine.js";

describe("AEGIS Phase 41 — Knowledge Gap Engine", () => {
  it("identifies areas of uncertainty and bounds risk without inventing knowledge", () => {
    const gap = KnowledgeGapEngine.evaluateGap("Quantum Circuit Simulation", 0, 0);
    expect(gap.gapLevel).toBe("NO_KNOWLEDGE");
    expect(gap.recommendation).toContain("exploratory spikes");

    const strong = KnowledgeGapEngine.evaluateGap("Express + Prisma REST Architecture", 8, 3);
    expect(strong.gapLevel).toBe("HIGH_CONFIDENCE_KNOWLEDGE");
  });
});
