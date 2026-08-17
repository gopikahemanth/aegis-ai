import { describe, it, expect } from "vitest";
import { RequirementDiscoveryEngine } from "../requirement-discovery-engine.js";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Discovery Engine", () => {
  it("converts multi-signal evidence into concrete candidate requirement", () => {
    const signals = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });
    const report = RequirementDiscoveryEngine.discoverRequirements(signals);

    expect(report.totalCandidates).toBe(1);
    expect(report.primaryCandidate?.id).toBe("REQ-061");
    expect(report.primaryCandidate?.title).toContain("Member Data Bulk Export");
    expect(report.primaryCandidate?.evidenceStrength).toBe("COMPELLING");
    expect(report.primaryCandidate?.confidence).toBeGreaterThanOrEqual(0.90);
  });
});
