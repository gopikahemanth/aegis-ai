import { describe, it, expect } from "vitest";
import { ProductPlanningEngine } from "../product-planning-engine.js";
import { ProductQualityAggregator } from "../product-quality-aggregator.js";
import { ProductAcceptanceCoordinator } from "../product-acceptance-coordinator.js";

describe("AEGIS Phase 50 — Product Acceptance Coordinator", () => {
  it("strictly accepts product when all 12 operational checklist items and quality standards pass", () => {
    const plan = ProductPlanningEngine.createProductPlan("Build a complete modern LMS platform", "AegisLMS");
    const qualityReport = ProductQualityAggregator.aggregate(0, 96, 98);

    const acceptance = ProductAcceptanceCoordinator.evaluateAcceptance(plan, qualityReport);
    expect(acceptance.isAccepted).toBe(true);
    expect(acceptance.status).toBe("ACCEPTED");
    expect(acceptance.checklist.requirements).toBe(true);
    expect(acceptance.checklist.build).toBe(true);
    expect(acceptance.checklist.runtime).toBe(true);
    expect(acceptance.checklist.uiUx).toBe(true);
  });
});
