import { describe, it, expect } from "vitest";
import { UXArchitectureEngine } from "../ux-architecture-engine.js";
import { PageCompositionEngine } from "../page-composition-engine.js";

describe("AEGIS Phase 49 — Page Composition Engine", () => {
  it("composes structured sections for landing, dashboard, and data table pages", () => {
    const plan = UXArchitectureEngine.planUX("TestApp", "CRM");
    const dashboardLayout = PageCompositionEngine.composePage(plan.authenticatedPages[0]);

    expect(dashboardLayout.layoutStructure).toBe("APP_SHELL");
    expect(dashboardLayout.sections.some((s) => s.componentType === "KPI_GRID")).toBe(true);

    const landingLayout = PageCompositionEngine.composePage(plan.publicPages[0]);
    expect(landingLayout.layoutStructure).toBe("FULL_WIDTH_LANDING");
    expect(landingLayout.sections.some((s) => s.componentType === "HERO")).toBe(true);
  });
});
