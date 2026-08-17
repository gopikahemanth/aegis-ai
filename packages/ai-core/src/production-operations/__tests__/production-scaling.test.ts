import { describe, it, expect } from "vitest";
import { ProductionScalingEngine } from "../production-scaling-engine.js";
import { ProductionStateEngine } from "../production-state-engine.js";

describe("AEGIS Phase 55 — Production Scaling Engine", () => {
  it("recommends SCALE_OUT when CPU exceeds 85% and request rate is high", () => {
    const state = ProductionStateEngine.captureState({
      customMetrics: { cpuUsagePercentage: 92, requestRatePerSec: 620 },
    });

    const rec = ProductionScalingEngine.evaluateScaling(state);
    expect(rec.recommendationType).toBe("SCALE_OUT");
    expect(rec.resourceTarget).toBe("COMPUTE_WORKERS");
    expect(rec.requiresAuthorization).toBe(true);
  });

  it("recommends NO_ACTION during nominal baseline workload", () => {
    const state = ProductionStateEngine.captureState();
    const rec = ProductionScalingEngine.evaluateScaling(state);
    expect(rec.recommendationType).toBe("NO_ACTION");
    expect(rec.requiresAuthorization).toBe(false);
  });
});
