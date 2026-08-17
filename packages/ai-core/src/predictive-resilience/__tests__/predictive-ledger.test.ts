import { describe, it, expect, beforeEach } from "vitest";
import { PredictiveResilienceLedger } from "../predictive-resilience-ledger.js";

describe("AEGIS Phase 29 — Predictive Resilience Ledger", () => {
  beforeEach(() => {
    PredictiveResilienceLedger.reset();
  });

  it("records cryptographically hashed, append-only predictive event records", () => {
    const entry = PredictiveResilienceLedger.recordDecision({
      actorId: "pred_lead_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "FORECAST_FAILURE",
      decisionType: "FAILURE_FORECAST",
      evidenceSummary: "Forecasted memory creep on worker pool with 94% confidence.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_PREDICTIVE_HASH");
    expect(PredictiveResilienceLedger.getLedger().length).toBe(1);
  });
});
