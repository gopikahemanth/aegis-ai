import { describe, it, expect } from "vitest";
import { CustomerJourneyEngine } from "../customer-journey-engine.js";

describe("AEGIS Phase 38 — Customer Journey Engine", () => {
  it("models customer journey progression and detects journey bottlenecks", () => {
    const report = CustomerJourneyEngine.evaluateJourney("cust_1", "proj_gym", true, true, true, false, 10);
    expect(report.completedMilestones.length).toBeGreaterThan(0);
    expect(report.currentMilestone).toBe("RETENTION");
    expect(report.journeyBottlenecksDetected.length).toBe(0);
  });

  it("detects journey bottleneck when a stage is stalled for extended periods", () => {
    const report = CustomerJourneyEngine.evaluateJourney("cust_2", "proj_gym", false, false, false, false, 45);
    expect(report.journeyBottlenecksDetected.length).toBeGreaterThan(0);
  });
});
