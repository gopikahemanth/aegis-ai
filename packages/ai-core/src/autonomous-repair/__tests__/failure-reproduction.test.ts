import { describe, it, expect } from "vitest";
import { FailureReproductionEngine } from "../failure-reproduction-engine.js";

describe("AEGIS Phase 57 — Failure Reproduction Engine", () => {
  it("deterministically reproduces reported 500 error on payments endpoint", () => {
    const result = FailureReproductionEngine.reproduceFailure("Payments are broken. Returns 500.");
    expect(result.state).toBe("REPRODUCED");
    expect(result.reproductionRate).toBe(1.0);
    expect(result.attempts.length).toBeGreaterThan(0);
    expect(result.attempts[0].actualStatus).toBe(500);
  });

  it("handles non-reproducible issues cleanly with NOT_REPRODUCED state", () => {
    const result = FailureReproductionEngine.reproduceFailure("Intermittent ghost bug", {
      simulateNonReproducible: true,
    });
    expect(result.state).toBe("NOT_REPRODUCED");
    expect(result.reproducedCount).toBe(0);
  });
});
