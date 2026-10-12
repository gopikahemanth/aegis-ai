import { describe, it, expect } from "vitest";
import { ExperienceCapabilityResolver } from "../experience-capability-plan.js";

describe("ExperienceCapabilityResolver", () => {
  it("resolves 3D fantasy prompt to IMMERSIVE_3D with REAL_3D_REQUIRED=true and webgl renderingMode", () => {
    const prompt = "Kazzoo: An immersive whimsical 3D animated fantasy adventure universe with claymation visuals and volumetric clouds";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("IMMERSIVE_3D");
    expect(plan.renderingMode).toBe("webgl");
    expect(plan.real3dRequired).toBe(true);
    expect(plan.compositionMode).toBe("cinematic-world");
    expect(plan.forbiddenSubstitutions).toContain("cards-for-world");
    expect(plan.forbiddenSubstitutions).toContain("css-transforms-for-3d");
    expect(plan.requiredRuntimeCapabilities).toContain("webgl-canvas");
  });

  it("resolves scrollytelling prompt to SCROLL_STORY", () => {
    const prompt = "A rich scrollytelling journey scroll revealing the history of architecture";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("SCROLL_STORY");
    expect(plan.interactionMode).toBe("scroll-driven-storytelling");
    expect(plan.compositionMode).toBe("split-narrative");
    expect(plan.real3dRequired).toBe(false);
  });

  it("resolves interactive map prompt to INTERACTIVE_MAP", () => {
    const prompt = "An interactive map and world explorer with selectable biomes and pins";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("INTERACTIVE_MAP");
    expect(plan.interactionMode).toBe("spatial-navigation");
    expect(plan.real3dRequired).toBe(false);
  });

  it("resolves dashboard prompt to DASHBOARD", () => {
    const prompt = "An operational metrics dashboard with server telemetry and KPI monitoring";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("DASHBOARD");
    expect(plan.renderingMode).toBe("standard-dom");
    expect(plan.real3dRequired).toBe(false);
  });

  it("resolves ecommerce prompt to COMMERCE", () => {
    const prompt = "An artisan bakery storefront with shopping cart and product catalog";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("COMMERCE");
    expect(plan.real3dRequired).toBe(false);
  });

  it("resolves editorial prompt to EDITORIAL", () => {
    const prompt = "An editorial magazine with longform journalism and design essays";
    const plan = ExperienceCapabilityResolver.resolve(prompt);

    expect(plan.experienceType).toBe("EDITORIAL");
    expect(plan.real3dRequired).toBe(false);
  });
});
