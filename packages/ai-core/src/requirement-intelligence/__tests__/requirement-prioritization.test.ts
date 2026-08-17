import { describe, it, expect } from "vitest";
import { RequirementPrioritizationEngine } from "../requirement-prioritization-engine.js";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";
import { RequirementImpactEngine } from "../requirement-impact-engine.js";

describe("AEGIS Phase 61 — Requirement Prioritization Engine", () => {
  it("prioritizes validated requirements based on user impact and business value", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);
    const impact = RequirementImpactEngine.analyzeImpact(validation.primaryRequirement!);

    const prioritized = RequirementPrioritizationEngine.prioritize(
      [validation.primaryRequirement!],
      { [validation.primaryRequirement!.requirement.id]: impact }
    );

    expect(prioritized.totalPrioritized).toBe(1);
    expect(prioritized.topItem?.priorityTier).toBe("P1_HIGH");
    expect(prioritized.topItem?.userImpactScore).toBeGreaterThanOrEqual(90);
    expect(prioritized.topItem?.businessValueScore).toBeGreaterThanOrEqual(90);
  });
});
