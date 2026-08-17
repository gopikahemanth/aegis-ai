import { describe, it, expect } from "vitest";
import { OrganizationalLearningEngine } from "../organizational-learning-engine.js";

describe("AEGIS Phase 31 — Organizational Learning Engine", () => {
  it("calibrates confidence factors with guaranteed zero safety policy mutations", () => {
    const report = OrganizationalLearningEngine.extractLearning("org_core", 25);
    expect(report.historicalDecisionsAnalyzed).toBe(25);
    expect(report.safetyPolicyMutationsAttempted).toBe(0);
    expect(report.confidenceCalibrationFactor).toBeGreaterThan(0.9);
  });
});
