import { describe, it, expect } from "vitest";
import { ReadOnlyBrowserValidator } from "../read-only-browser-validator.js";
import type { ProductExperiencePlan } from "../../design/product-experience-plan.js";

describe("Product Identity & Completeness Gate", () => {
  const aureliaPlan: ProductExperiencePlan = {
    planId: "plan_aurelia_test",
    experiencePattern: "configurator-workspace",
    expectedHomeRoute: "/",
    primaryActivity: "content-creation",
    requiredCapabilities: [
      {
        id: "fixture-configurator",
        name: "Custom Fixture Configurator",
        evidenceVocabulary: ["fixture", "configur", "luminaire", "lighting"],
        controlsRequired: ["button", "select"],
      },
      {
        id: "photometric-calculator",
        name: "Photometric Lux Calculator",
        evidenceVocabulary: ["lux", "photometric", "distribution", "lumens"],
        controlsRequired: ["input", "button"],
      },
      {
        id: "quote-estimator",
        name: "Project Quote Estimator",
        evidenceVocabulary: ["quote", "cost", "price", "estimate"],
        controlsRequired: ["input", "button"],
      },
    ],
    forbiddenVocabulary: ["Match Score", "Resume", "Keyword Cloud", "Borrowed Books", "Inverter", "MPPT"],
    forbiddenArtifacts: ["resumeUpload", "KeywordCloud", "MatchDashboard"],
    expectedRoutes: ["/", "/configurator", "/calculator", "/estimator"],
    authWallAllowed: false,
  };

  function createMockPage(htmlDom: {
    bodyText: string;
    headings?: string[];
    buttons?: string[];
    inputs?: Array<{ tag: string; type: string; name: string; placeholder: string }>;
    canvases?: number;
    sliders?: number;
    tables?: number;
  }) {
    return {
      evaluate: async (fn: any) => {
        return {
          bodyText: htmlDom.bodyText,
          headings: htmlDom.headings || [],
          buttons: htmlDom.buttons || [],
          inputs: htmlDom.inputs || [],
          canvases: htmlDom.canvases || 0,
          sliders: htmlDom.sliders || 0,
          tables: htmlDom.tables || 0,
        };
      },
      $: async () => ({
        type: async () => {},
        click: async () => {},
      }),
    };
  }

  it("Test 1 — Generic login page on '/' fails auth wall check and blocks approval", async () => {
    const loginPage = createMockPage({
      bodyText: "Sign In Email user@example.com Password Sign In",
      headings: ["Sign In"],
      buttons: ["Sign In"],
      inputs: [
        { tag: "input", type: "email", name: "email", placeholder: "user@example.com" },
        { tag: "input", type: "password", name: "password", placeholder: "••••••••" },
      ],
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(loginPage, aureliaPlan);
    expect(result.passed).toBe(false);
    expect(result.authWall.detected).toBe(true);
    expect(result.authWall.allowed).toBe(false);
    expect(result.mismatchReasons.some(r => r.includes("authentication screen"))).toBe(true);
  });

  it("Test 2 — Login route explicitly requested passes auth wall check", async () => {
    const authPortalPlan: ProductExperiencePlan = {
      ...aureliaPlan,
      authWallAllowed: true,
      requiredCapabilities: [],
    };

    const loginPage = createMockPage({
      bodyText: "Sign In Email user@example.com Password Sign In",
      headings: ["Sign In"],
      buttons: ["Sign In"],
      inputs: [
        { tag: "input", type: "email", name: "email", placeholder: "user@example.com" },
        { tag: "input", type: "password", name: "password", placeholder: "••••••••" },
      ],
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(loginPage, authPortalPlan);
    expect(result.authWall.allowed).toBe(true);
  });

  it("Test 3 — Normal Aurelia Studio workspace with all 3 tools passes product identity", async () => {
    const studioPage = createMockPage({
      bodyText: "Aurelia Studio Architectural Lighting Fixture Configurator Luminaire Optic Finish Photometric Lux Distribution Lumens Wattage Project Quote Estimator Cost Breakdown",
      headings: ["Aurelia Studio", "Fixture Configurator", "Photometric Lux Calculator", "Quote Estimator"],
      buttons: ["Configure Fixture", "Calculate Lux", "Generate Quote"],
      inputs: [
        { tag: "select", type: "select", name: "optic", placeholder: "Select optic" },
        { tag: "input", type: "number", name: "lumens", placeholder: "Lumens" },
        { tag: "input", type: "number", name: "quantity", placeholder: "Quantity" },
      ],
      sliders: 1,
      canvases: 1,
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(studioPage, aureliaPlan);
    expect(result.passed).toBe(true);
    expect(result.authWall.detected).toBe(false);
    expect(result.experiencePattern.matched).toBe(true);
    expect(result.featureEvidence.length).toBe(3);
    expect(result.featureEvidence.every(f => f.visible)).toBe(true);
    expect(result.forbiddenEvidence.length).toBe(0);
  });

  it("Test 4 — Missing one required capability fails verification", async () => {
    // Missing quote estimator
    const partialPage = createMockPage({
      bodyText: "Aurelia Studio Fixture Configurator Luminaire Photometric Lux Calculator Lumens",
      headings: ["Aurelia Studio", "Fixture Configurator", "Photometric Lux Calculator"],
      buttons: ["Configure Fixture", "Calculate Lux"],
      inputs: [
        { tag: "select", type: "select", name: "optic", placeholder: "Select optic" },
        { tag: "input", type: "number", name: "lumens", placeholder: "Lumens" },
      ],
      sliders: 1,
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(partialPage, aureliaPlan);
    expect(result.passed).toBe(false);
    expect(result.mismatchReasons.some(r => r.includes("Quote Estimator"))).toBe(true);
  });

  it("Test 5 — Foreign domain vocabulary (ATS/Solar contamination) fails verification", async () => {
    const contaminatedPage = createMockPage({
      bodyText: "Aurelia Studio Fixture Configurator Photometric Lux Quote Estimator Match Score Resume Keyword Cloud",
      headings: ["Aurelia Studio"],
      buttons: ["Configure Fixture", "Calculate Lux", "Generate Quote"],
      inputs: [
        { tag: "select", type: "select", name: "optic", placeholder: "Select optic" },
        { tag: "input", type: "number", name: "lumens", placeholder: "Lumens" },
      ],
      sliders: 1,
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(contaminatedPage, aureliaPlan);
    expect(result.passed).toBe(false);
    expect(result.forbiddenEvidence.length).toBeGreaterThan(0);
    expect(result.mismatchReasons.some(r => r.includes("Forbidden foreign-domain vocabulary"))).toBe(true);
  });

  it("Test 6 — Inert UI with no interactive tool controls fails experiencePattern for configurator-workspace", async () => {
    const inertPage = createMockPage({
      bodyText: "Aurelia Studio Fixture Configurator Photometric Lux Quote Estimator Impress visitors and drive contact",
      headings: ["Aurelia Studio"],
      buttons: ["Contact Us"],
      inputs: [], // zero tool inputs, zero canvases, zero sliders, zero tables
    });

    const result = await ReadOnlyBrowserValidator.validateProductIdentity(inertPage, aureliaPlan);
    expect(result.passed).toBe(false);
    expect(result.experiencePattern.matched).toBe(false);
  });
});
