import { describe, it, expect } from "vitest";
import { RequirementDerivationEngine } from "../requirement-derivation-engine.js";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Derivation Engine", () => {
  it("tracks requirement provenance across EXPLICIT, DERIVED, and ASSUMED clauses", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const lineage = RequirementDerivationEngine.deriveLineage(validation.primaryRequirement!);
    expect(lineage.primaryProvenance).toBe("EXPLICIT");
    expect(lineage.clauses.some((c) => c.type === "EXPLICIT")).toBe(true);
    expect(lineage.clauses.some((c) => c.type === "DERIVED")).toBe(true);
    expect(lineage.clauses.some((c) => c.type === "ASSUMED")).toBe(true);
  });
});
