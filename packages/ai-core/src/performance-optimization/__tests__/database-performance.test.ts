import { describe, it, expect } from "vitest";
import { DatabasePerformanceEngine } from "../database-performance-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";

describe("AEGIS Phase 59 — Database Performance Engine", () => {
  it("detects N+1 query loop and missing composite indexes", () => {
    const baseline = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const report = DatabasePerformanceEngine.analyzeDatabase(baseline);

    expect(report.isDatabaseOptimized).toBe(false);
    expect(report.totalQueriesPerLoad).toBe(47);
    expect(report.issues.some((i) => i.type === "N_PLUS_ONE")).toBe(true);
    expect(report.suggestedIndexes.length).toBeGreaterThan(0);
  });
});
