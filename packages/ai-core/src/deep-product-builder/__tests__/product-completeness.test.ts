import { describe, it, expect } from "vitest";
import { ProductCompletenessEngine } from "../product-completeness-engine.js";

describe("AEGIS Phase 51 — Product Completeness Engine", () => {
  it("enforces 100% feature completeness and rejects acceptance if critical gaps exist", () => {
    const cleanScore = ProductCompletenessEngine.evaluateCompleteness(0, 100);
    expect(cleanScore.isFullyComplete).toBe(true);
    expect(cleanScore.overallPercentage).toBe(100);

    const blockedScore = ProductCompletenessEngine.evaluateCompleteness(1, 95);
    expect(blockedScore.isFullyComplete).toBe(false);
    expect(blockedScore.criticalIncompleteCount).toBe(1);
  });
});
