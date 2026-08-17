import { describe, it, expect, beforeEach } from "vitest";
import { ValueDecisionLedger } from "../value-decision-ledger.js";

describe("AEGIS Phase 26 — Value Decision Ledger", () => {
  beforeEach(() => {
    ValueDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only economic decisions", () => {
    const entry1 = ValueDecisionLedger.recordDecision({
      actorId: "cfo_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "AUTHORIZE_INVESTMENT",
      decisionType: "RESOURCE_ALLOCATION",
      investmentAmountINR: 100000,
      realizedValueINR: 0,
    });

    const entry2 = ValueDecisionLedger.recordDecision({
      actorId: "cfo_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      operation: "VERIFY_ROI",
      decisionType: "VALUE_VERIFIED",
      investmentAmountINR: 100000,
      realizedValueINR: 320000,
    });

    expect(entry2.previousHash).toBe(entry1.entryHash);
    expect(ValueDecisionLedger.getLedger().length).toBe(2);
  });
});
