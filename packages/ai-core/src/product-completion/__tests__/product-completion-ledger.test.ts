import { describe, it, expect, beforeEach } from "vitest";
import { ProductCompletionLedger } from "../product-completion-ledger.js";

describe("AEGIS Phase 45 — Product Completion Ledger", () => {
  beforeEach(() => {
    ProductCompletionLedger.reset();
  });

  it("records all completion events in an immutable cryptographic hash chain", () => {
    const entry1 = ProductCompletionLedger.recordEntry({
      actor: "qa_engineer",
      project: "proj_gym",
      eventType: "REQUIREMENT_VERIFIED",
      requirementId: "REQ-001",
      evidenceReferences: ["ev_reg_01"],
    });

    const entry2 = ProductCompletionLedger.recordEntry({
      actor: "product_manager",
      project: "proj_gym",
      eventType: "PRODUCT_ACCEPTED",
      requirementId: "ALL",
      evidenceReferences: ["ev_acceptance_cert"],
    });

    expect(entry2.previousHash).toBe(entry1.currentHash);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    // Test tampering detection
    const entries = ProductCompletionLedger.getEntries();
    entries[0].actor = "tampered_actor";
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(false);
  });
});
