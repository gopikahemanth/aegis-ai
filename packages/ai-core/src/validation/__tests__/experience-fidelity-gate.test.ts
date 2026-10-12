import { describe, it, expect } from "vitest";
import { ReadOnlyBrowserValidator } from "../read-only-browser-validator.js";
import type { ProductExperiencePlan } from "../../design/product-experience-plan.js";

describe("ReadOnlyBrowserValidator.validateExperienceFidelity", () => {
  const fake3dPlan: ProductExperiencePlan = {
    planId: "plan_test_3d",
    experiencePattern: "immersive-3d",
    experienceCapability: {
      experienceType: "IMMERSIVE_3D",
      renderingMode: "webgl",
      interactionMode: "spatial-navigation",
      compositionMode: "cinematic-world",
      motionMode: "continuous-scroll-linked",
      depthModel: "foreground-midground-background-3d",
      mediaModel: "procedural-3d-geometry",
      mediaRequirements: ["WebGL canvas"],
      assetRequirements: ["3D meshes"],
      navigationModel: "floating-overlay",
      responsiveStrategy: "adaptive-3d",
      performanceStrategy: "dynamic-dpr",
      accessibilityStrategy: "aria",
      requiredRuntimeCapabilities: ["webgl-canvas", "scene-ready"],
      requiredVisualSignals: ["canvas[data-aegis-3d]"],
      forbiddenSubstitutions: ["cards-for-world"],
      real3dRequired: true,
    },
    expectedHomeRoute: "/",
    primaryActivity: "content-browsing",
    requiredCapabilities: [],
    forbiddenVocabulary: [],
    forbiddenArtifacts: [],
    expectedRoutes: ["/"],
    authWallAllowed: false,
  };

  const fakeStandardPlan: ProductExperiencePlan = {
    planId: "plan_test_std",
    experiencePattern: "operations-dashboard",
    experienceCapability: {
      experienceType: "DASHBOARD",
      renderingMode: "standard-dom",
      interactionMode: "dashboard-monitoring",
      compositionMode: "modular-dashboard",
      motionMode: "event-driven",
      depthModel: "flat-surface",
      mediaModel: "charts",
      mediaRequirements: [],
      assetRequirements: [],
      navigationModel: "top-nav",
      responsiveStrategy: "standard-responsive",
      performanceStrategy: "standard",
      accessibilityStrategy: "aria",
      requiredRuntimeCapabilities: [],
      requiredVisualSignals: [],
      forbiddenSubstitutions: [],
      real3dRequired: false,
    },
    expectedHomeRoute: "/",
    primaryActivity: "data-analysis",
    requiredCapabilities: [],
    forbiddenVocabulary: [],
    forbiddenArtifacts: [],
    expectedRoutes: ["/"],
    authWallAllowed: false,
  };

  it("passes when real 3D WebGL canvas and scene are rendered for 3D plan", async () => {
    const mockPage = {
      evaluate: async (fn: any) => ({
        hasExperienceContract: true,
        experienceContract: {
          experienceType: "IMMERSIVE_3D",
          renderingMode: "webgl",
          ready: true,
          sceneReady: true,
          objectsRendered: 18,
          interactiveObjects: 4,
          scrollDriven: true,
          animationActive: true,
        },
        canvasCount: 1,
        webglDetected: true,
        webglContextActive: true,
        aegisCanvasAttr: true,
        cardGridElements: 0,
        mapElements: 0,
        scrollNarrativeElements: 0,
      }),
    };

    const result = await ReadOnlyBrowserValidator.validateExperienceFidelity(mockPage as any, fake3dPlan);
    expect(result.passed).toBe(true);
    expect(result.real3dRequired).toBe(true);
    expect(result.webglCanvasDetected).toBe(true);
    expect(result.mismatchReasons).toHaveLength(0);
    expect(result.passedChecks.some(c => c.includes("Real 3D WebGL scene/canvas"))).toBe(true);
  });

  it("fails when REAL_3D_REQUIRED=true but no WebGL canvas or 3D scene is present", async () => {
    const mockPage = {
      evaluate: async (fn: any) => ({
        hasExperienceContract: false,
        experienceContract: null,
        canvasCount: 0,
        webglDetected: false,
        webglContextActive: false,
        aegisCanvasAttr: false,
        cardGridElements: 6, // generic cards
        mapElements: 0,
        scrollNarrativeElements: 0,
      }),
    };

    const result = await ReadOnlyBrowserValidator.validateExperienceFidelity(mockPage as any, fake3dPlan);
    expect(result.passed).toBe(false);
    expect(result.mismatchReasons.some(r => r.includes("EXPERIENCE_FIDELITY_FAILURE: Real 3D / WebGL experience was required"))).toBe(true);
    expect(result.forbiddenSubstitutionDetected).toBe(true);
  });

  it("passes standard non-3D dashboard without requiring WebGL", async () => {
    const mockPage = {
      evaluate: async (fn: any) => ({
        hasExperienceContract: false,
        experienceContract: null,
        canvasCount: 0,
        webglDetected: false,
        webglContextActive: false,
        aegisCanvasAttr: false,
        cardGridElements: 4,
        mapElements: 0,
        scrollNarrativeElements: 0,
      }),
    };

    const result = await ReadOnlyBrowserValidator.validateExperienceFidelity(mockPage as any, fakeStandardPlan);
    expect(result.passed).toBe(true);
    expect(result.real3dRequired).toBe(false);
    expect(result.mismatchReasons).toHaveLength(0);
  });
});
