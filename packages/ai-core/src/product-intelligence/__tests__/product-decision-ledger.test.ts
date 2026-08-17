import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseProductDecisionLedger } from "../product-decision-ledger.js";

describe("AEGIS Phase 37 — Enterprise Product Decision Ledger", () => {
  beforeEach(() => {
    EnterpriseProductDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only product ledger entries", () => {
    const entry = EnterpriseProductDecisionLedger.recordEntry({
      actorId: "vp_prod_1",
      tenantId: "tenant_gym",
      organizationId: "org_global",
      projectId: "proj_gym",
      opportunityId: "opp_1",
      eventType: "PRODUCT_INTELLIGENCE_CERTIFIED",
      evidenceSummary: "Product feature verified across all 26 governance tiers.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_PRODUCT_LEDGER_HASH");
    expect(EnterpriseProductDecisionLedger.getEntries().length).toBe(1);
  });
});
