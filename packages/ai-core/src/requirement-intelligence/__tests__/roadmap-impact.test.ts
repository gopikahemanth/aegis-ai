import { describe, it, expect } from "vitest";
import { RoadmapImpactEngine } from "../roadmap-impact-engine.js";

describe("AEGIS Phase 61 — Roadmap Impact Engine", () => {
  it("measures post-deployment real-world operational outcome and hours saved", () => {
    const report = RoadmapImpactEngine.measureImpact("Member Data Bulk Export");
    expect(report.isImpactProven).toBe(true);
    expect(report.supportTicketReductionPercent).toBe(85.0);
    expect(report.administrativeHoursSavedWeekly).toBeGreaterThanOrEqual(4.0);
    expect(report.comparisons.every((c) => c.goalMet)).toBe(true);
  });
});
