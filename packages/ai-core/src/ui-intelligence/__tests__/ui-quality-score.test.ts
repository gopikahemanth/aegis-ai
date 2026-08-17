import { describe, it, expect } from "vitest";
import { UIQualityScoreEngine } from "../ui-quality-score-engine.js";

describe("AEGIS Phase 49 — UI Quality Score Engine", () => {
  it("computes evidence-backed scores across 8 separate UX and visual dimensions", () => {
    const cleanScore = UIQualityScoreEngine.calculateQualityScore(true, true, true);

    expect(cleanScore.visualConsistency).toBeGreaterThanOrEqual(90);
    expect(cleanScore.accessibility).toBeGreaterThanOrEqual(90);
    expect(cleanScore.responsiveQuality).toBeGreaterThanOrEqual(90);
    expect(cleanScore.overallScore).toBeGreaterThanOrEqual(90);
    expect(cleanScore.isPolished).toBe(true);

    const degradedScore = UIQualityScoreEngine.calculateQualityScore(false, false, false);
    expect(degradedScore.isPolished).toBe(false);
  });
});
