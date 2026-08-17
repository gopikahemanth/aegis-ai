import { describe, it, expect, beforeEach } from "vitest";
import { ContinuityDecisionLedger } from "../continuity-decision-ledger.js";

describe("AEGIS Phase 28 — Continuity Decision Ledger", () => {
  beforeEach(() => {
    ContinuityDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only continuity event records", () => {
    const entry = ContinuityDecisionLedger.recordDecision({
      actorId: "dr_lead_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "CALIBRATE_RECOVERY_LEARNING",
      decisionType: "LEARNING_CALIBRATED",
      evidenceSummary: "Calibrated RTO accuracy to 96% with zero policy mutations.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_CONTINUITY_HASH");
    expect(ContinuityDecisionLedger.getLedger().length).toBe(1);
  });
});
