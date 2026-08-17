import { describe, it, expect } from "vitest";
import { PreIncidentInterventionPlanner } from "../pre-incident-intervention.js";

describe("AEGIS Phase 29 — Pre-Incident Intervention Planner", () => {
  it("plans interventions with zero mutations and identifies authorization requirements", () => {
    const plan = PreIncidentInterventionPlanner.planIntervention("proj_core", "INCREASE_CAPACITY", 40);
    expect(plan.mutationsAttempted).toBe(0);
    expect(plan.authorizationRequired).toBe(true);
    expect(plan.riskReductionPercentage).toBe(40);
  });
});
