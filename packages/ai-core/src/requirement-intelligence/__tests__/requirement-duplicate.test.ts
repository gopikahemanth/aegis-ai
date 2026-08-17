import { describe, it, expect } from "vitest";
import { RequirementDuplicateEngine } from "../requirement-duplicate-engine.js";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Duplicate Engine", () => {
  it("detects existing CSV export feature and recommends EXTEND_EXISTING_FEATURE", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const result = RequirementDuplicateEngine.checkDuplicates(
      validation.primaryRequirement!,
      ["Member Management", "Export Member Data as CSV", "Member Search"]
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.recommendation).toBe("EXTEND_EXISTING_FEATURE");
    expect(result.duplicateFeatureName).toBe("Export Member Data as CSV");
  });

  it("permits proceeding as new when no existing capability matches", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const result = RequirementDuplicateEngine.checkDuplicates(
      validation.primaryRequirement!,
      ["Member Management", "Member Search", "Check-in QR Scanner"]
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.recommendation).toBe("PROCEED_AS_NEW");
  });
});
