import { describe, it, expect, beforeEach } from "vitest";
import { ProductionHealthMonitor } from "../production-health-monitor.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Health Monitor", () => {
  beforeEach(() => {
    ProductionHealthMonitor.resetHistory();
  });

  it("records continuous observation sliding history", () => {
    const obs1 = ProductionHealthMonitor.collectSignal();
    const obs2 = ProductionHealthMonitor.collectSignal(ProductionStateEngine.captureState());

    expect(obs1.sampleCount).toBe(1);
    expect(obs2.sampleCount).toBe(2);
    expect(ProductionHealthMonitor.getHistory()).toHaveLength(2);
    expect(ProductionHealthMonitor.getLatest()?.id).toBe(obs2.id);
  });
});
