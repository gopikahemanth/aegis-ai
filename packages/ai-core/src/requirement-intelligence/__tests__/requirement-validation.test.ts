import { describe, it, expect } from "vitest";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Validation Engine", () => {
  it("validates high-evidence candidate requirements as VERIFIED_REQUIREMENT", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    expect(validation.hasSufficientEvidence).toBe(true);
    expect(validation.primaryRequirement?.status).toBe("VERIFIED_REQUIREMENT");
    expect(validation.primaryRequirement?.evidenceScore).toBeGreaterThanOrEqual(90);
    expect(validation.primaryRequirement?.isValidated).toBe(true);
  });

  it("classifies vague, unsupported requests as INSUFFICIENT_EVIDENCE", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateVagueRequest: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    expect(validation.hasSufficientEvidence).toBe(false);
    expect(validation.validatedRequirements[0].status).toBe("INSUFFICIENT_EVIDENCE");
    expect(validation.validatedRequirements[0].isValidated).toBe(false);
  });
});
