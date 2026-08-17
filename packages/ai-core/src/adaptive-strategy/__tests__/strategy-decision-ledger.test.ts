import { describe, it, expect, beforeEach } from "vitest";
import { StrategyDecisionLedger } from "../strategy-decision-ledger.js";

describe("AEGIS Phase 25 — Strategy Decision Ledger", () => {
  beforeEach(() => {
    StrategyDecisionLedger.reset();
  });

  it("records cryptographic append-only strategic decision history", () => {
    const record = StrategyDecisionLedger.recordDecision({
      decisionId: "strat_dec_1",
      actorId: "cto_1",
      organizationId: "org_alpha",
      operation: "REBALANCE_PORTFOLIO",
      recommendation: "Accelerate Security Initiative",
      decision: "APPROVED",
      reason: "Critical compliance milestone approaching",
    });

    expect(record.entryHash).toBeDefined();
    expect(StrategyDecisionLedger.getDecisions().length).toBe(1);
  });
});
