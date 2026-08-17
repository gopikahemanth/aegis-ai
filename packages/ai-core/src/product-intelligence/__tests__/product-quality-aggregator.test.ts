import { describe, it, expect } from "vitest";
import { ProductQualityAggregator } from "../product-quality-aggregator.js";

describe("AEGIS Phase 50 — Product Quality Aggregator", () => {
  it("enforces that critical defect blockers immediately reject overall acceptance regardless of score", () => {
    const cleanReport = ProductQualityAggregator.aggregate(0, 96, 98);
    expect(cleanReport.isAccepted).toBe(true);
    expect(cleanReport.overallScore).toBeGreaterThanOrEqual(90);

    const blockedReport = ProductQualityAggregator.aggregate(1, 96, 98);
    expect(blockedReport.isAccepted).toBe(false);
    expect(blockedReport.criticalDefectCount).toBe(1);
  });
});
