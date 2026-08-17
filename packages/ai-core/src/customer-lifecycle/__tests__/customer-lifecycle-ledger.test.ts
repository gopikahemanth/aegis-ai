import { describe, it, expect, beforeEach } from "vitest";
import { CustomerLifecycleDecisionLedger } from "../customer-lifecycle-ledger.js";

describe("AEGIS Phase 38 — Customer Lifecycle Decision Ledger", () => {
  beforeEach(() => {
    CustomerLifecycleDecisionLedger.reset();
  });

  it("records cryptographically hashed, append-only customer lifecycle ledger entries", () => {
    const entry = CustomerLifecycleDecisionLedger.recordEntry({
      actorId: "cs_lead_1",
      tenantId: "tenant_gym",
      organizationId: "org_global",
      projectId: "proj_gym",
      customerId: "cust_1",
      eventType: "CUSTOMER_LIFECYCLE_CERTIFIED",
      evidenceSummary: "Customer lifecycle and retention verified across all 27 governance tiers.",
    });

    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBe("GENESIS_CUSTOMER_LIFECYCLE_LEDGER_HASH");
    expect(CustomerLifecycleDecisionLedger.getEntries().length).toBe(1);
  });
});
