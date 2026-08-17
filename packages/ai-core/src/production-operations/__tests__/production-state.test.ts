import { describe, it, expect } from "vitest";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production State Engine", () => {
  it("captures unified state across 8 subsystems and metrics", () => {
    const state = ProductionStateEngine.captureState();
    expect(state.isOperational).toBe(true);
    expect(state.overallState).toBe("HEALTHY");
    expect(Object.keys(state.components)).toHaveLength(8);
    expect(state.metrics.errorRatePercentage).toBeLessThan(0.1);
  });

  it("enforces PROCESS_RUNNING ≠ HEALTHY when component is degraded", () => {
    const state = ProductionStateEngine.captureState({ simulateDegraded: ["database"] });
    expect(state.components.database.processRunning).toBe(true);
    expect(state.components.database.state).toBe("DEGRADED");
    expect(state.overallState).toBe("DEGRADED");
  });
});
