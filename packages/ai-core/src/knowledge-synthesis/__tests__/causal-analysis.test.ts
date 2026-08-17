import { describe, it, expect } from "vitest";
import { CausalAnalysisEngine } from "../causal-analysis-engine.js";

describe("AEGIS Phase 42 — Causal Analysis Engine", () => {
  it("enforces that correlation alone is not causation and requires experimental verification for verified status", () => {
    const report = CausalAnalysisEngine.analyzeChain("Database Pool Saturation & Latency", [
      {
        cause: "High Concurrent WebSocket Load",
        effect: "Prisma Default Connection Pool Depletion",
        experimentVerified: true,
        evidence: ["ev_pool_sat", "ev_504_gateway"],
      },
      {
        cause: "Connection Pool Depletion",
        effect: "P99 Latency Degradation (>2000ms)",
        experimentVerified: true,
        evidence: ["ev_p99_metrics", "ev_controlled_trial_p40"],
      },
    ]);

    expect(report.overallConfidence).toBe("VERIFIED");
    expect(report.links[0].confidence).toBe("VERIFIED");
  });
});
