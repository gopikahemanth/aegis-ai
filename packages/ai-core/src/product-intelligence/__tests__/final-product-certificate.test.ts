import { describe, it, expect } from "vitest";
import { ProductPlanningEngine } from "../product-planning-engine.js";
import { ProductQualityAggregator } from "../product-quality-aggregator.js";
import { ProductAcceptanceCoordinator } from "../product-acceptance-coordinator.js";
import { ProductDeliveryCoordinator } from "../product-delivery-coordinator.js";
import { FinalProductCertificateEngine } from "../final-product-certificate.js";

describe("AEGIS Phase 50 — Final Product Certificate Engine", () => {
  it("generates Tier 37 final product certificate representing the actual finished application", () => {
    const plan = ProductPlanningEngine.createProductPlan("Build a complete gym application", "AegisGym");
    const qualityReport = ProductQualityAggregator.aggregate(0, 96, 98);
    const acceptance = ProductAcceptanceCoordinator.evaluateAcceptance(plan, qualityReport);
    const manifest = ProductDeliveryCoordinator.deliverProduct(plan, acceptance);

    const cert = FinalProductCertificateEngine.issueCertificate(manifest);
    expect(cert.gate).toBe("FinalProductGate");
    expect(cert.tier).toBe(37);
    expect(cert.status).toBe("CERTIFIED");
    expect(cert.product).toBe("AegisGym");
    expect(cert.buildVerified).toBe(true);
    expect(cert.runtimeVerified).toBe(true);
    expect(cert.uiVerified).toBe(true);
  });
});
