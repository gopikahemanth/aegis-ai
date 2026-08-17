import { describe, it, expect } from "vitest";
import { OrganizationalIntelligenceEngine } from "../organizational-intelligence-engine.js";

describe("AEGIS Phase 42 — Organizational Intelligence Engine", () => {
  it("models organizational capabilities based on concrete verified evidence", () => {
    const report = OrganizationalIntelligenceEngine.evaluateCapabilities("org_global", 12);
    expect(report.overallMaturityLevel).toBe("EXCELLENT");
    expect(report.capabilities.length).toBeGreaterThanOrEqual(3);
    expect(report.capabilities[0].scorePct).toBeGreaterThanOrEqual(90);
  });
});
