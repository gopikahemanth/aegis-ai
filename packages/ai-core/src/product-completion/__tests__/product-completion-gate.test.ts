import { describe, it, expect, beforeEach } from "vitest";
import { ProductCompletionGate } from "../product-completion-gate.js";
import { ProductCompletionLedger } from "../product-completion-ledger.js";

describe("AEGIS Phase 45 — Product Completion Gate (Tier 34)", () => {
  beforeEach(() => {
    ProductCompletionLedger.reset();
  });

  it("evaluates all 34 tiers and issues ProductCompletionCertificate", () => {
    ProductCompletionLedger.recordEntry({
      actor: "system",
      project: "proj_gym",
      eventType: "GENESIS_PRODUCT_COMPLETION",
      requirementId: "REQ-000",
      evidenceReferences: ["ev_gen"],
    });

    const cert = ProductCompletionGate.evaluate(process.cwd());

    expect(cert.tier).toBe(34);
    expect(cert.status).toBe("PRODUCT_COMPLETION_CERTIFIED");
    expect(cert.previousTierCount).toBe(33);
    expect(cert.requirementsVerified).toBe(true);
    expect(cert.featuresVerified).toBe(true);
    expect(cert.fullStackIntegrationVerified).toBe(true);
    expect(cert.runtimeVerified).toBe(true);
    expect(cert.browserWorkflowsVerified).toBe(true);
    expect(cert.apiDatabaseContractsVerified).toBe(true);
    expect(cert.uxCompletenessVerified).toBe(true);
    expect(cert.criticalDefectsRemaining).toBe(0);
    expect(cert.traceabilityVerified).toBe(true);
    expect(cert.productAccepted).toBe(true);
    expect(cert.ledgerIntegrityVerified).toBe(true);
  });
});
