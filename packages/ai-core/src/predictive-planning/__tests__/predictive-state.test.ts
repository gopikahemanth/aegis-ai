import { describe, it, expect } from "vitest";
import { PredictiveEnterpriseStateEngine } from "../predictive-enterprise-state.js";

describe("AEGIS Phase 32 — Predictive Enterprise State Engine", () => {
  it("constructs an authoritative predictive state preserving evidence references", () => {
    const state = PredictiveEnterpriseStateEngine.buildState("org_core", "30_DAYS", ["ev_telemetry_1", "ev_sla_2"]);
    expect(state.forecastHorizon).toBe("30_DAYS");
    expect(state.currentState).toBe("OPTIMIZED");
    expect(state.evidenceReferences.length).toBe(2);
    expect(state.confidenceScore).toBeGreaterThan(0.9);
  });
});
