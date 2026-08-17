import { describe, it, expect } from "vitest";
import { TradeoffIntelligenceEngine } from "../tradeoff-intelligence-engine.js";

describe("AEGIS Phase 42 — Trade-Off Intelligence Engine", () => {
  it("models multi-dimensional enterprise tradeoffs and outputs recommendations only", () => {
    const analysis = TradeoffIntelligenceEngine.analyzeTradeoff(
      "Reliability Rigor",
      "Infrastructure Cost",
      50,
      ["proj_gym", "proj_crm"],
      ["ev_sla_metrics", "ev_cloud_spend"]
    );

    expect(analysis.tradeoffId).toBeDefined();
    expect(analysis.recommendedRebalancePosition).toBe(50);
    expect(analysis.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
