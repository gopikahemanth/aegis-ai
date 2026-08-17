import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseChangeDecisionLedger } from "../change-decision-ledger.js";

describe("AEGIS Phase 34 — Enterprise Change Decision Ledger", () => {
  beforeEach(() => {
    EnterpriseChangeDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only change governance events", () => {
    const event = EnterpriseChangeDecisionLedger.recordEvent({
      actorId: "lead_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      changeId: "chg_1",
      eventType: "CHANGE_GOVERNANCE_CERTIFIED",
      evidenceSummary: "Change verified across all 23 governance tiers.",
    });

    expect(event.entryHash).toBeDefined();
    expect(event.previousHash).toBe("GENESIS_CHANGE_LEDGER_HASH");
    expect(EnterpriseChangeDecisionLedger.getEvents().length).toBe(1);
  });
});
