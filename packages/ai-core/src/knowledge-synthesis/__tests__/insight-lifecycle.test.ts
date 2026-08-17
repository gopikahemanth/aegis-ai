import { describe, it, expect, beforeEach } from "vitest";
import { InsightLifecycleEngine } from "../insight-lifecycle-engine.js";

describe("AEGIS Phase 42 — Insight Lifecycle Engine", () => {
  beforeEach(() => {
    InsightLifecycleEngine.reset();
  });

  it("coordinates insight lifecycle progression while preserving history", () => {
    const init = InsightLifecycleEngine.initializeLifecycle("ins_123");
    expect(init.currentStage).toBe("DISCOVERED");

    InsightLifecycleEngine.transitionStage("ins_123", "SYNTHESIZING");
    InsightLifecycleEngine.transitionStage("ins_123", "VALIDATING");
    const supported = InsightLifecycleEngine.transitionStage("ins_123", "SUPPORTED");

    expect(supported.currentStage).toBe("SUPPORTED");
    expect(supported.history.length).toBe(4);
  });
});
