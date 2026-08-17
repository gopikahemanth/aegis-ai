import { describe, it, expect } from "vitest";
import { RequirementSignalEngine } from "../requirement-signal-engine.js";

describe("AEGIS Phase 61 — Requirement Signal Engine", () => {
  it("collects multi-source requirement signals from feedback, usage analytics, and business OKRs", () => {
    const report = RequirementSignalEngine.collectSignals("GymMaster Pro", {
      simulateExportDemand: true,
    });

    expect(report.totalSignals).toBe(3);
    expect(report.signals.some((s) => s.source === "USER_FEEDBACK")).toBe(true);
    expect(report.signals.some((s) => s.source === "USAGE_ANALYTICS")).toBe(true);
    expect(report.signals.some((s) => s.source === "BUSINESS_OBJECTIVE")).toBe(true);
  });
});
