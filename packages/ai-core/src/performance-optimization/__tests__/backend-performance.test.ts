import { describe, it, expect } from "vitest";
import { BackendPerformanceEngine } from "../backend-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Backend Performance Engine", () => {
  it("diagnoses slow operations and excessive serialization overhead", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = BackendPerformanceEngine.analyzeBackend(baseline);

    expect(report.isBackendOptimized).toBe(false);
    expect(report.bottlenecks.length).toBeGreaterThan(0);
    expect(report.bottlenecks.some((b) => b.category === "REPEATED_COMPUTATION")).toBe(true);
  });
});
