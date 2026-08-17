import { describe, it, expect } from "vitest";
import { ContinuousImprovementEngine } from "../continuous-improvement-engine.js";

describe("AEGIS Phase 34 — Continuous Improvement Engine", () => {
  it("proposes improvements while enforcing authorization requirement invariant", () => {
    const prop = ContinuousImprovementEngine.proposeImprovement("proj_core", "INCREASE_OBSERVABILITY");
    expect(prop.proposalType).toBe("INCREASE_OBSERVABILITY");
    expect(prop.authorizationRequired).toBe(true);
    expect(prop.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });
});
