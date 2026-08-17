import { describe, it, expect } from "vitest";
import { ProductPlanningEngine } from "../product-planning-engine.js";

describe("AEGIS Phase 50 — Product Planning Engine", () => {
  it("creates a single unified machine-readable ProductPlan for all subsystems", () => {
    const plan = ProductPlanningEngine.createProductPlan(
      "Build a complete modern e-commerce platform with products, cart, and checkout",
      "AegisCommerce"
    );

    expect(plan.productName).toBe("AegisCommerce");
    expect(plan.domain).toBe("ECOMMERCE");
    expect(plan.specification.features.length).toBeGreaterThanOrEqual(4);
    expect(plan.architecture.dbModels).toContain("Product");
    expect(plan.workflows.length).toBeGreaterThanOrEqual(1);
    expect(plan.uiArchitecture.publicPages.length).toBeGreaterThanOrEqual(2);
    expect(plan.designSystem.colors.primary[500]).toBeDefined();
    expect(plan.security.authMethod).toBe("JWT_BEARER");
  });
});
