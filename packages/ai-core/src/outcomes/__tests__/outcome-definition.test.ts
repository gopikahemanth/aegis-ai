import { describe, it, expect, beforeEach } from "vitest";
import { OutcomeDefinitionManager } from "../outcome-definition.js";

describe("AEGIS Phase 24 — Outcome Definition Manager", () => {
  beforeEach(() => {
    OutcomeDefinitionManager.reset();
  });

  it("defines measurable business outcomes with baseline, target, and deadline", () => {
    const outcome = OutcomeDefinitionManager.defineOutcome({
      outcomeId: "out_api_reliability",
      initiativeId: "init_1",
      organizationId: "org_alpha",
      name: "Improve Production API Availability",
      metric: "API Availability %",
      baselineValue: 99.1,
      targetValue: 99.95,
      measurementUnit: "%",
      deadline: "2026-12-31",
    });

    expect(outcome.outcomeId).toBe("out_api_reliability");
    expect(outcome.status).toBe("ON_TRACK");
    expect(OutcomeDefinitionManager.getOutcome("out_api_reliability")).toBeDefined();
  });
});
