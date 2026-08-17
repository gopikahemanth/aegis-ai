import { describe, it, expect } from "vitest";
import { ContinuityScoreEngine } from "../continuity-score-engine.js";

describe("AEGIS Phase 28 — Continuity Score Engine", () => {
  it("calculates multidimensional business continuity score", () => {
    const report = ContinuityScoreEngine.calculateScore({
      projectId: "proj_core",
      recoveryReadiness: 100,
      rtoCompliance: 95,
      rpoCompliance: 100,
      backupReliability: 95,
      redundancySufficiency: 90,
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(95);
    expect(report.status).toBe("OPTIMIZED");
  });
});
