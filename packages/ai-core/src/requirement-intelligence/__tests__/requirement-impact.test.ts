import { describe, it, expect } from "vitest";
import { RequirementImpactEngine } from "../requirement-impact-engine.js";
import { RequirementValidationEngine } from "../requirement-validation-engine.js";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Impact Engine", () => {
  it("evaluates multi-layer blast radius across Frontend, Backend, Database, API, and Security", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const discovery = RequirementDiscoveryEngine.discoverRequirements(signals);
    const normalized = RequirementNormalizationEngine.normalize(discovery.candidates);
    const validation = RequirementValidationEngine.validateRequirements(normalized);

    const impact = RequirementImpactEngine.analyzeImpact(validation.primaryRequirement!);
    expect(impact.overallBlastRadius).toBe("MODERATE");
    expect(impact.layers.some((l) => l.layer === "FRONTEND" && l.impactLevel === "MODERATE")).toBe(true);
    expect(impact.layers.some((l) => l.layer === "AUTHORIZATION" && l.impactLevel === "MODERATE")).toBe(true);
    expect(impact.layers.some((l) => l.layer === "EXISTING_WORKFLOWS" && l.impactLevel === "NONE")).toBe(true);
  });
});
