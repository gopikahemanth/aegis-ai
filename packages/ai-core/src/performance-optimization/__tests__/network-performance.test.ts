import { describe, it, expect } from "vitest";
import { NetworkPerformanceEngine } from "../network-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Network Performance Engine", () => {
  it("diagnoses duplicate network requests and oversized payload transfers", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = NetworkPerformanceEngine.analyzeNetwork(baseline);

    expect(report.isNetworkEfficient).toBe(false);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.findings.some((f) => f.type === "DUPLICATE_REQUEST")).toBe(true);
  });
});
