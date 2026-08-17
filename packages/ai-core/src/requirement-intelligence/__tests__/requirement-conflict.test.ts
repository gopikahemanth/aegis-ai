import { describe, it, expect } from "vitest";
import { RequirementConflictEngine } from "../requirement-conflict-engine.js";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Conflict Engine", () => {
  it("detects security conflict between unrestricted export and privacy policies", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateConflictRequest: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const report = RequirementConflictEngine.detectConflicts(validation.primaryRequirement!, {
      simulateSecurityPolicyConflict: true,
    });

    expect(report.hasConflict).toBe(true);
    expect(report.isBlockedBySecurity).toBe(true);
    expect(report.conflicts[0].category).toBe("SECURITY_CONFLICT");
    expect(report.conflicts[0].resolutionAction).toBe("CONFLICT_REQUIRES_DECISION");
  });

  it("passes conflict check when requirements respect security boundaries", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const report = RequirementConflictEngine.detectConflicts(validation.primaryRequirement!);

    expect(report.hasConflict).toBe(false);
    expect(report.isBlockedBySecurity).toBe(false);
  });
});
