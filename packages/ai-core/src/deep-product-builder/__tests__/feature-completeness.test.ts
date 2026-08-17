import { describe, it, expect } from "vitest";
import { FeatureCompletenessEngine } from "../feature-completeness-engine.js";

describe("AEGIS Phase 51 — Feature Completeness Engine", () => {
  it("tracks the deep feature lifecycle and rejects completion when obligations remain unmet", () => {
    const completeStatus = FeatureCompletenessEngine.evaluateFeatureCompleteness("f1", "Auth", "COMPLETE");
    expect(completeStatus.isComplete).toBe(true);
    expect(completeStatus.verifications.workflowVerified).toBe(true);
    expect(completeStatus.unmetObligations.length).toBe(0);

    const partialStatus = FeatureCompletenessEngine.evaluateFeatureCompleteness("f2", "Cart", "SCAFFOLDED");
    expect(partialStatus.isComplete).toBe(false);
    expect(partialStatus.unmetObligations.length).toBeGreaterThan(0);
  });
});
