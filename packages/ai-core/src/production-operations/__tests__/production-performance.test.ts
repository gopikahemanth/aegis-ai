import { describe, it, expect } from "vitest";
import { ProductionPerformanceEngine } from "../production-performance-engine.js";

describe("AEGIS Phase 55 — Production Performance Engine", () => {
  it("confirms stable performance across releases", () => {
    const analysis = ProductionPerformanceEngine.analyzePerformance("v1.1.0", "v1.0.0");
    expect(analysis.hasRegression).toBe(false);
    expect(analysis.p95DeltaMs).toBeLessThan(200);
  });

  it("detects performance regression between versions", () => {
    const analysis = ProductionPerformanceEngine.analyzePerformance("v1.1.0", "v1.0.0", {
      simulateRegression: true,
    });
    expect(analysis.hasRegression).toBe(true);
    expect(analysis.p95DeltaMs).toBeGreaterThan(500);
    expect(analysis.detail).toContain("PERFORMANCE REGRESSION");
  });
});
