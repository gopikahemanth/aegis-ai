import { describe, it, expect } from "vitest";
import { PerformanceEngine } from "../performance-engine.js";

describe("AEGIS Phase 14 — Performance & Latency Benchmarking", () => {
  it("validates that startup, API latency, and DB query response are within budget", () => {
    const report = PerformanceEngine.benchmark({
      startupDurationMs: 310,
      apiLatencyMs: 35,
      dbLatencyMs: 12,
    });

    expect(report.status).toBe("PERFORMANCE_PASS");
    expect(report.benchmarks.length).toBe(4);
  });

  it("fails performance gate if latency exceeds maximum threshold", () => {
    const report = PerformanceEngine.benchmark({
      startupDurationMs: 8000, // exceeds 3000ms
    });

    expect(report.status).toBe("PERFORMANCE_FAILURE");
  });
});
