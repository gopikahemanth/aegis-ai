import { describe, it, expect, beforeEach } from "vitest";
import { PredictivePlanningLedger } from "../predictive-planning-ledger.js";

describe("AEGIS Phase 32 — Predictive Planning Ledger", () => {
  beforeEach(() => {
    PredictivePlanningLedger.reset();
  });

  it("records cryptographically hashed, append-only planning decision records", () => {
    const entry = PredictivePlanningLedger.recordDecision({
      actorId: "lead_planner_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "OPTIMIZE_SCENARIO",
      decisionType: "SCENARIO_SIMULATED",
      evidenceSummary: "Scenario 'Accelerate Gateway V2' simulated with 0 mutations.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_PLANNING_LEDGER_HASH");
    expect(PredictivePlanningLedger.getLedger().length).toBe(1);
  });
});
