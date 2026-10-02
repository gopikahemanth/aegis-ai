import { describe, it, expect } from "vitest";
import { CapabilityPlanner } from "../capability-planner.js";
import { DesignDirector } from "../design-director.js";
import { DesignSystemGenerator } from "../design-system-generator.js";
import { ProductUnderstanding } from "../product-understanding.js";

describe("Summary Metric Scoping & Non-Dashboard Stat-Card Prevention Invariant", () => {
  it("TEST 1: Non-dashboard pages are flagged with isSummaryOverview: false", () => {
    const characteristics = ProductUnderstanding.analyze("cozy warm houseplant botanical care companion app with watering schedule and growth photos");
    const priority = CapabilityPlanner.plan(characteristics);

    expect(priority.informationArchitecture.pages.length).toBeGreaterThan(0);
    for (const page of priority.informationArchitecture.pages) {
      if (page.route === "/" || page.route === "/history" || page.route === "/progress") {
        expect(page.isSummaryOverview).toBe(false);
      }
    }
  });

  it("TEST 2: Consumer storefront has zero overview pages and does not generate MetricCard.tsx", () => {
    const prompt = "artisan bakery with daily bread menu, custom sourdough orders, and pickup slots";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const priority = CapabilityPlanner.plan(characteristics);
    const brief = DesignDirector.direct(characteristics, priority, {} as any, prompt);

    expect(brief.pageCompositions.every(p => p.isSummaryOverview === false)).toBe(true);

    const dsGen = new DesignSystemGenerator();
    const spec: any = { name: "Bakery", userPrompt: prompt, dataModels: [] };
    const files = dsGen.generate(spec, brief);

    const metricCardFile = files.find(f => f.path.includes("MetricCard.tsx"));
    expect(metricCardFile).toBeUndefined();

    const indexFile = files.find(f => f.path === "src/design-system/index.ts");
    expect(indexFile).toBeDefined();
    expect(indexFile!.content).not.toContain("MetricCard");
  });

  it("TEST 3: Operations dashboard generates MetricCard.tsx and flags overview pages correctly", () => {
    const prompt = "fleet dispatch logistics operations dashboard with real-time route telemetry and fleet KPIs";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const priority = CapabilityPlanner.plan(characteristics);
    const brief = DesignDirector.direct(characteristics, priority, {} as any, prompt);

    const homeComp = brief.pageCompositions.find(p => p.route === "/");
    expect(homeComp).toBeDefined();
    expect(homeComp!.isSummaryOverview).toBe(true);

    const dsGen = new DesignSystemGenerator();
    const spec: any = { name: "FleetOps", userPrompt: prompt, dataModels: [] };
    const files = dsGen.generate(spec, brief);

    const metricCardFile = files.find(f => f.path.includes("MetricCard.tsx"));
    expect(metricCardFile).toBeDefined();

    const indexFile = files.find(f => f.path === "src/design-system/index.ts");
    expect(indexFile!.content).toContain("MetricCard");
  });
});
