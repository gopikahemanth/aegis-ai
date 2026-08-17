import { describe, it, expect } from "vitest";
import { OutcomeMeasurementEngine } from "../outcome-measurement-engine.js";

describe("AEGIS Phase 24 — Outcome Measurement Engine", () => {
  it("evaluates outcome achievement against observed production reality without conflating deployment with success", () => {
    const outcome = {
      outcomeId: "out_incidents",
      initiativeId: "init_1",
      organizationId: "org_acme",
      name: "Reduce Monthly API Incidents",
      metric: "Incident Count",
      baselineValue: 20,
      targetValue: 0,
      measurementUnit: "incidents",
      deadline: "2026-12-31",
      status: "ON_TRACK" as const,
    };

    // If observed incidents reduced from 20 to 1
    const reportAchieved = OutcomeMeasurementEngine.evaluateOutcome(outcome, 1);
    expect(reportAchieved.status).toBe("ON_TRACK");
    expect(reportAchieved.achievementPercentage).toBeGreaterThanOrEqual(90);

    // If observed incidents only reduced from 20 to 18 (failed target)
    const reportOffTrack = OutcomeMeasurementEngine.evaluateOutcome(outcome, 18);
    expect(reportOffTrack.status).toBe("OFF_TRACK");
    expect(reportOffTrack.achievementPercentage).toBeLessThan(40);
  });
});
