import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseInnovationDecisionLedger } from "../innovation-decision-ledger.js";

describe("AEGIS Phase 36 — Enterprise Innovation Decision Ledger", () => {
  beforeEach(() => {
    EnterpriseInnovationDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only innovation ledger entries", () => {
    const event = EnterpriseInnovationDecisionLedger.recordEvent({
      actorId: "prod_lead_1",
      tenantId: "tenant_gym",
      organizationId: "org_global",
      projectId: "proj_gym",
      opportunityId: "opp_1",
      eventType: "INNOVATION_GOVERNANCE_CERTIFIED",
      evidenceSummary: "Innovation verified across all 25 governance tiers.",
    });

    expect(event.entryHash).toBeDefined();
    expect(event.previousHash).toBe("GENESIS_INNOVATION_LEDGER_HASH");
    expect(EnterpriseInnovationDecisionLedger.getEvents().length).toBe(1);
  });
});
