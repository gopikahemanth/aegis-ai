import { describe, it, expect } from "vitest";
import { AutonomousActionPlanner } from "../autonomous-action-planner.js";

describe("AEGIS Phase 32 — Autonomous Action Planner", () => {
  it("classifies non-destructive observability as SAFE_AUTOMATION and capacity changes as REQUIRES_AUTHORIZATION", () => {
    const obsAction = AutonomousActionPlanner.planAction("proj_core", "INCREASE_OBSERVABILITY");
    expect(obsAction.safetyClassification).toBe("SAFE_AUTOMATION");
    expect(obsAction.authorizationRequired).toBe(false);

    const capAction = AutonomousActionPlanner.planAction("proj_core", "REQUEST_MORE_CAPACITY");
    expect(capAction.safetyClassification).toBe("REQUIRES_AUTHORIZATION");
    expect(capAction.authorizationRequired).toBe(true);
  });
});
