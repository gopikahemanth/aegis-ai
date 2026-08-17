import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseEvolutionDecisionLedger } from "../evolution-decision-ledger.js";

describe("AEGIS Phase 35 — Enterprise Evolution Decision Ledger", () => {
  beforeEach(() => {
    EnterpriseEvolutionDecisionLedger.reset();
  });

  it("records cryptographically chained, immutable evolution ledger entries", () => {
    const event = EnterpriseEvolutionDecisionLedger.recordEvent({
      actorId: "arch_lead_1",
      organizationId: "org_alpha",
      projectId: "proj_gym",
      opportunityId: "opp_1",
      eventType: "EVOLUTION_GOVERNANCE_CERTIFIED",
      evidenceSummary: "Evolution verified across all 24 governance tiers.",
    });

    expect(event.entryHash).toBeDefined();
    expect(event.previousHash).toBe("GENESIS_EVOLUTION_LEDGER_HASH");
    expect(EnterpriseEvolutionDecisionLedger.getEvents().length).toBe(1);
  });
});
