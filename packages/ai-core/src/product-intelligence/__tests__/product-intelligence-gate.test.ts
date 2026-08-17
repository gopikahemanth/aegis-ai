import { describe, it, expect } from "vitest";
import { ProductPlanningEngine } from "../product-planning-engine.js";
import { ProductQualityAggregator } from "../product-quality-aggregator.js";
import { ProductAcceptanceCoordinator } from "../product-acceptance-coordinator.js";
import { ProductDeliveryCoordinator } from "../product-delivery-coordinator.js";
import { ProductIntelligenceGate } from "../product-intelligence-gate.js";

describe("AEGIS Phase 50 — Product Intelligence Gate", () => {
  it("verifies consistent multi-subsystem evidence and seals cryptographic ledger", () => {
    const plan = ProductPlanningEngine.createProductPlan("Build a complete booking application", "AegisBooking");
    const qualityReport = ProductQualityAggregator.aggregate(0, 96, 98);
    const acceptance = ProductAcceptanceCoordinator.evaluateAcceptance(plan, qualityReport);
    const manifest = ProductDeliveryCoordinator.deliverProduct(plan, acceptance);

    const certificate = ProductIntelligenceGate.verifyAndCertify(acceptance, manifest);
    expect(certificate.tier).toBe(37);
    expect(certificate.status).toBe("CERTIFIED");
  });
});
