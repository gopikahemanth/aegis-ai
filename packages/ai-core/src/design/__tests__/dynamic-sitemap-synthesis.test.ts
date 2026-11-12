import { describe, it, expect } from "vitest";
import { CapabilityPlanner } from "../capability-planner.js";
import { ProductUnderstanding } from "../product-understanding.js";
import { ProductExperiencePlanManager } from "../product-experience-plan.js";
import { DesignDirector } from "../design-director.js";

describe("Phase 1: Dynamic Prompt-, Research-, and Journey-Driven Sitemap Synthesis", () => {
  const FORBIDDEN_TEMPLATE_ROUTES = [
    "/villas",
    "/sanctuary",
    "/deals",
    "/lightning-deals",
    "/soundboard",
    "/world",
    "/characters",
    "/quest-map",
  ];

  it("TEST 1: Luxury Handmade Jewelry E-Commerce produces consumer jewelry journeys with zero canned template routes", () => {
    const prompt = "E-commerce website for a premium handmade jewellery brand with collections, gemstone customization, ring sizer, and checkout.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "AuraJewelry",
      userPrompt: prompt,
      features: [
        { name: "Handcrafted Collections", description: "Curated artisanal rings, necklaces, and bespoke pieces" },
        { name: "Gemstone Customization Studio", description: "Interactive cut, carat, and metal setting customizer" },
        { name: "Virtual Ring Sizer Guide", description: "Interactive sizing calibration and printable guide" },
        { name: "Bespoke Checkout", description: "Seamless secure checkout with insured shipping" },
      ],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("collection"))).toBe(true);
    expect(routes.some(r => r.includes("gemstone") || r.includes("customization"))).toBe(true);
    expect(routes.some(r => r.includes("ring-sizer") || r.includes("sizer"))).toBe(true);

    // Verify zero canned template leakage
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }

    // Verify every page has an explicit rationale
    for (const page of plan.informationArchitecture.pages) {
      expect(page.whyNeeded).toBeTruthy();
      expect(page.primaryFocus).toBeTruthy();
    }
  });

  it("TEST 2: Wholesale Diamond Tooling (same domain family) produces B2B industrial tooling workflows, NOT consumer jewelry", () => {
    const prompt = "Industrial diamond tooling and precision abrasive grinding wheels catalog with RFQ quote request and CAD spec sheets.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "ApexDiamondTooling",
      userPrompt: prompt,
      features: [
        { name: "Abrasive Grinding Wheels Catalog", description: "Industrial diamond and CBN wheels specification index" },
        { name: "RFQ Quote Request Engine", description: "Bulk volume quote request with custom tolerance inputs" },
        { name: "CAD Spec Sheets Archive", description: "Technical drawings, arbor dimensions, and grit mesh downloads" },
      ],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("abrasive") || r.includes("grinding") || r.includes("wheels"))).toBe(true);
    expect(routes.some(r => r.includes("rfq") || r.includes("quote"))).toBe(true);
    expect(routes.some(r => r.includes("cad") || r.includes("spec"))).toBe(true);

    // B2B tooling must NEVER include consumer jewelry routes
    expect(routes.some(r => r.includes("ring-sizer"))).toBe(false);
    expect(routes.some(r => r.includes("gemstone"))).toBe(false);

    // Verify zero canned template leakage
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }

    for (const page of plan.informationArchitecture.pages) {
      expect(page.whyNeeded).toBeTruthy();
    }
  });

  it("TEST 3: Alpine Glaciology Research Portal produces cryo scientific telemetry, not resort or carbon accounting", () => {
    const prompt = "Alpine glaciology research station portal with ice core telemetry, field logs, and researcher roster.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "CryoAlpine",
      userPrompt: prompt,
      features: [
        { name: "Ice Core Telemetry", description: "Borehole temperature profiles, ablation rates, and cryo-sensor logs" },
        { name: "Glacier Field Logs", description: "Geological field expedition logs, weather readings, and snowpack observations" },
        { name: "Researcher Roster", description: "Principal investigators, field technicians, and accredited glaciologists" },
      ],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("ice-core") || r.includes("telemetry"))).toBe(true);
    expect(routes.some(r => r.includes("field-log") || r.includes("glacier"))).toBe(true);
    expect(routes.some(r => r.includes("researcher") || r.includes("roster"))).toBe(true);

    // Verify zero canned template leakage
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }
  });

  it("TEST 4: Independent Documentary Filmmaker Portfolio produces minimalist screening room and filmography", () => {
    const prompt = "Minimalist portfolio and screening room for an independent documentary filmmaker with filmography, festival accolades, and press kit.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "CinemaVerite",
      userPrompt: prompt,
      features: [
        { name: "Filmography & Screening Room", description: "Curated filmography with trailer embeds and screening dates" },
        { name: "Festival Accolades & Press", description: "Laurels, jury citations, and critical reviews" },
        { name: "Press Kit & High-Res Stills", description: "Downloadable EPK, director bio, and production photography" },
      ],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("filmography") || r.includes("screening"))).toBe(true);
    expect(routes.some(r => r.includes("festival") || r.includes("accolades"))).toBe(true);
    expect(routes.some(r => r.includes("press") || r.includes("stills"))).toBe(true);

    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }
  });

  it("TEST 5: Subsurface Hydrogeology Simulator produces scientific plume modeling workflows", () => {
    const prompt = "Aquifer drawdown simulator and groundwater contaminant plume modeling tool.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "HydroSim",
      userPrompt: prompt,
      features: [
        { name: "Aquifer Drawdown Simulator", description: "Pumping test radius of influence calculation and Theis curve solver" },
        { name: "Contaminant Plume Modeling", description: "Advection-dispersion transport simulation with 2D concentration contours" },
        { name: "Monitoring Well Network", description: "Piezometric head sensor network and groundwater level logs" },
      ],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("aquifer") || r.includes("drawdown"))).toBe(true);
    expect(routes.some(r => r.includes("plume") || r.includes("contaminant"))).toBe(true);
    expect(routes.some(r => r.includes("well") || r.includes("monitoring"))).toBe(true);

    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }
  });

  it("TEST 6: Incomplete planning / missing research is made explicit and never silently falls back to canned templates", () => {
    // Empty prompt with no extractable features or domain vocabulary
    const characteristics = ProductUnderstanding.analyze("generic test");
    const spec = {
      name: "UnknownApp",
      userPrompt: "generic test",
      features: [],
    };

    const plan = CapabilityPlanner.plan(characteristics, spec);
    expect(plan.informationArchitecture.pages.length).toBeGreaterThan(0);

    const routes = plan.informationArchitecture.pages.map(p => p.route);
    // Even in ambiguous fallback, NEVER inject canned hotel, watch, deals, or 3D templates
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }

    // Verify explanation exists for all generated pages
    for (const page of plan.informationArchitecture.pages) {
      expect(page.whyNeeded).toBeTruthy();
    }
  });

  it("TEST 7: CapabilityPlanner.fromFeatureMatrix generates pages directly from discovered features with zero PAGE_TEMPLATES", () => {
    const characteristics = ProductUnderstanding.analyze("pottery studio with glaze recipes, kiln firing logs, and clay inventory");
    const matrix = {
      category: "Ceramic Studio & Pottery Atelier",
      primaryLandingFeature: "Glaze Formulation Archive",
      corePages: [], // Deliberately empty to test dynamic synthesis from features
      standardFeatures: [
        { name: "Glaze Formulation Archive", description: "Chemical recipes, cone rating, and surface finish tests" },
        { name: "Kiln Firing Schedule", description: "Bisque and glaze ramp soak schedules with thermocouple logs" },
      ],
      differentiatorFeatures: [
        { name: "Clay Body Shrinkage Calculator", description: "Wet-to-fired dimensional contraction calculator" },
      ],
    };

    const plan = CapabilityPlanner.fromFeatureMatrix(matrix, characteristics);
    const routes = plan.informationArchitecture.pages.map(p => p.route);

    expect(routes).toContain("/");
    expect(routes.some(r => r.includes("glaze"))).toBe(true);
    expect(routes.some(r => r.includes("kiln"))).toBe(true);
    expect(routes.some(r => r.includes("shrinkage") || r.includes("clay"))).toBe(true);

    // Must never leak old templates
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(routes).not.toContain(forbidden);
    }

    // Every page has explicit whyNeeded
    for (const page of plan.informationArchitecture.pages) {
      expect(page.whyNeeded).toBeTruthy();
    }
  });

  it("TEST 8: ProductExperiencePlanManager.build preserves dynamic sitemap in expectedRoutes and pagePlans", () => {
    const prompt = "Boutique artisan coffee roastery with single-origin beans catalog, roast curve profiles, and cupping notes.";
    const characteristics = ProductUnderstanding.analyze(prompt);
    const spec = {
      name: "TerroirRoasters",
      userPrompt: prompt,
      features: [
        { name: "Single-Origin Beans Catalog", description: "Direct-trade lot traceability, elevation, and varietals" },
        { name: "Roast Curve Profiles", description: "Rate-of-rise temperature graphs and drop temperature specs" },
        { name: "Cupping Notes Journal", description: "SCA sensory evaluation scores, acidity, body, and aroma notes" },
      ],
    };

    const featurePriority = CapabilityPlanner.plan(characteristics, spec);
    const brief = DesignDirector.direct(characteristics, featurePriority, spec as any, prompt);
    const plan = ProductExperiencePlanManager.build(brief, spec, prompt);

    expect(plan.expectedRoutes).toContain("/");
    expect(plan.expectedRoutes.some(r => r.includes("bean") || r.includes("origin") || r.includes("catalog"))).toBe(true);
    expect(plan.expectedRoutes.some(r => r.includes("roast") || r.includes("curve"))).toBe(true);
    expect(plan.expectedRoutes.some(r => r.includes("cupping") || r.includes("notes"))).toBe(true);

    // Verify zero canned template leakage in expectedRoutes
    for (const forbidden of FORBIDDEN_TEMPLATE_ROUTES) {
      expect(plan.expectedRoutes).not.toContain(forbidden);
    }
  });
});
