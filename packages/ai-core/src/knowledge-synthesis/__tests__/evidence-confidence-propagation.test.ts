import { describe, it, expect } from "vitest";
import { EvidenceConfidencePropagationEngine } from "../evidence-confidence-propagation.js";

describe("AEGIS Phase 42 — Evidence Confidence Propagation Engine", () => {
  it("enforces that Weak Evidence + Weak Evidence != Strong Evidence and caps unverified confidence", () => {
    const weakInputs = [
      { evidenceId: "w1", sourceType: "HEURISTIC", isEmpiricallyVerified: false, qualityScore: 0.4, isContradicted: false },
      { evidenceId: "w2", sourceType: "HEURISTIC", isEmpiricallyVerified: false, qualityScore: 0.4, isContradicted: false },
      { evidenceId: "w3", sourceType: "HEURISTIC", isEmpiricallyVerified: false, qualityScore: 0.4, isContradicted: false },
    ];

    const weakReport = EvidenceConfidencePropagationEngine.calculateConfidence(weakInputs);
    expect(weakReport.isVerified).toBe(false);
    expect(weakReport.overallConfidenceScore).toBeLessThan(0.5);

    const strongInputs = [
      { evidenceId: "s1", sourceType: "CONTROLLED_TRIAL", isEmpiricallyVerified: true, qualityScore: 0.98, isContradicted: false },
      { evidenceId: "s2", sourceType: "RUNTIME_AUDIT", isEmpiricallyVerified: true, qualityScore: 0.95, isContradicted: false },
    ];

    const strongReport = EvidenceConfidencePropagationEngine.calculateConfidence(strongInputs);
    expect(strongReport.isVerified).toBe(true);
    expect(strongReport.overallConfidenceScore).toBeGreaterThanOrEqual(0.9);
  });
});
