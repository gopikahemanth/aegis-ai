import { describe, it, expect } from "vitest";
import { ProductSignalIntelligenceEngine } from "../product-signal-intelligence-engine.js";

describe("AEGIS Phase 37 — Product Signal Intelligence Engine", () => {
  it("discovers customer and product usage signals and separates signals from insights", () => {
    const signals = ProductSignalIntelligenceEngine.discoverSignals("proj_gym", 12, 0.22, 0.35);
    expect(signals.length).toBe(3);
    expect(signals.some((s) => s.type === "CUSTOMER_REQUEST")).toBe(true);
    expect(signals.some((s) => s.type === "CUSTOMER_FRICTION")).toBe(true);
    expect(signals.some((s) => s.type === "FEATURE_ADOPTION")).toBe(true);

    const insight = ProductSignalIntelligenceEngine.interpretInsight(signals[0]);
    expect(insight.insightId).toBeDefined();
    expect(insight.hypothesis).toContain("retention");
  });
});
