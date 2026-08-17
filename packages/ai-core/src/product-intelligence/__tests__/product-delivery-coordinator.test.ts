import { describe, it, expect } from "vitest";
import { ProductPlanningEngine } from "../product-planning-engine.js";
import { ProductQualityAggregator } from "../product-quality-aggregator.js";
import { ProductAcceptanceCoordinator } from "../product-acceptance-coordinator.js";
import { ProductDeliveryCoordinator } from "../product-delivery-coordinator.js";

describe("AEGIS Phase 50 — Product Delivery Coordinator", () => {
  it("packages and emits complete delivery manifest for accepted products", () => {
    const plan = ProductPlanningEngine.createProductPlan("Build a complete CRM platform", "AegisCRM");
    const qualityReport = ProductQualityAggregator.aggregate(0, 96, 98);
    const acceptance = ProductAcceptanceCoordinator.evaluateAcceptance(plan, qualityReport);

    const manifest = ProductDeliveryCoordinator.deliverProduct(plan, acceptance);
    expect(manifest.product).toBe("AegisCRM");
    expect(manifest.status).toBe("DELIVERED");
    expect(manifest.entryCommand).toBe("npm run dev");
    expect(manifest.build).toBe("PASS");
  });
});
