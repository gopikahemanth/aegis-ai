import { describe, it, expect } from "vitest";
import { AssetPerformanceEngine } from "../asset-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Asset Performance Engine", () => {
  it("analyzes asset compression potential while guaranteeing 100% visual fidelity", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = AssetPerformanceEngine.analyzeAssets(baseline);

    expect(report.isAssetsOptimized).toBe(false);
    expect(report.totalAssetSizeKb).toBeGreaterThan(1500);
    expect(report.checks.every((c) => c.visualFidelityRetainedPercent === 100)).toBe(true);
  });
});
