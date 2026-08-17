import { describe, it, expect } from "vitest";
import { ExecutionCanaryEngine } from "../execution-canary-engine.js";

describe("AEGIS Phase 33 — Execution Canary Engine", () => {
  it("promotes healthy canary stages progressively (PREVIEW -> CANARY -> PARTIAL -> FULL)", () => {
    const res1 = ExecutionCanaryEngine.evaluateCanary("exec_1", "PREVIEW", {
      errorRatePercentage: 0.0,
      p99LatencyMs: 40,
      apiSuccessRatePercentage: 100.0,
      healthProbePassed: true,
    });
    expect(res1.status).toBe("STAGE_PASSED");
    expect(res1.stage).toBe("CANARY");

    const res2 = ExecutionCanaryEngine.evaluateCanary("exec_1", "CANARY", {
      errorRatePercentage: 0.0,
      p99LatencyMs: 45,
      apiSuccessRatePercentage: 100.0,
      healthProbePassed: true,
    });
    expect(res2.stage).toBe("PARTIAL");
  });

  it("triggers ROLLBACK_REQUIRED if error rate or health probes fail", () => {
    const res = ExecutionCanaryEngine.evaluateCanary("exec_1", "CANARY", {
      errorRatePercentage: 4.5,
      p99LatencyMs: 80,
      apiSuccessRatePercentage: 95.5,
      healthProbePassed: false,
    });

    expect(res.status).toBe("ROLLBACK_REQUIRED");
    expect(res.promoted).toBe(false);
  });
});
