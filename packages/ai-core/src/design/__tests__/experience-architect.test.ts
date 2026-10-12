import { describe, it, expect } from "vitest";
import { ExperienceArchitect } from "../experience-architect.js";
import { ExperienceCapabilityResolver } from "../experience-capability-plan.js";

describe("ExperienceArchitect", () => {
  it("designs fundamentally different 3D spatial compositions for Perfume vs Space Museum vs Kazzoo vs Sneaker", () => {
    // 1. Luxury Perfume Brand
    const perfumePrompt = "Build a luxury perfume brand with an immersive 3D bottle experience and olfactive notes storytelling";
    const perfumeCap = ExperienceCapabilityResolver.resolve(perfumePrompt);
    const perfumeGraph = ExperienceArchitect.designComposition({
      prompt: perfumePrompt,
      productTitle: "Maison d'Aura",
      primaryActivity: "Fragrance Discovery & Olfactive Storytelling",
      experienceType: perfumeCap.experienceType,
      real3dRequired: perfumeCap.real3dRequired,
    });

    expect(perfumeGraph.spatialPlan?.sceneType).toBe("PRODUCT_REVEAL");
    expect(perfumeGraph.spatialPlan?.focalObject).toContain("flacon");
    expect(perfumeGraph.navigationModel).toBe("minimal-floating-wordmark");
    expect(perfumeGraph.sections?.some(s => s.name.includes("Flacon") || s.name.includes("Scent"))).toBe(true);

    // 2. Interactive Space Museum
    const spacePrompt = "Build an interactive space museum with orbiting planets, solar system orrery, and spacecraft exploration";
    const spaceCap = ExperienceCapabilityResolver.resolve(spacePrompt);
    const spaceGraph = ExperienceArchitect.designComposition({
      prompt: spacePrompt,
      productTitle: "AstroSphere Museum",
      primaryActivity: "Orbital Space Exploration & Celestial Education",
      experienceType: spaceCap.experienceType,
      real3dRequired: spaceCap.real3dRequired,
    });

    expect(spaceGraph.spatialPlan?.sceneType).toBe("SPATIAL_EXHIBITION");
    expect(spaceGraph.spatialPlan?.focalObject).toContain("Solar system");
    expect(spaceGraph.navigationModel).toBe("orbital-ring-compass");
    expect(spaceGraph.sections?.some(s => s.name.includes("Cosmic") || s.name.includes("Planetary"))).toBe(true);

    // 3. Kazzoo Whimsical Fantasy World
    const fantasyPrompt = "Build Kazzoo, a whimsical animated 3D fantasy adventure universe with claymation characters and floating islands";
    const fantasyCap = ExperienceCapabilityResolver.resolve(fantasyPrompt);
    const fantasyGraph = ExperienceArchitect.designComposition({
      prompt: fantasyPrompt,
      productTitle: "Kazzoo World",
      primaryActivity: "Fantasy World Exploration & Quest Discovery",
      experienceType: fantasyCap.experienceType,
      real3dRequired: fantasyCap.real3dRequired,
    });

    expect(fantasyGraph.spatialPlan?.sceneType).toBe("WORLD_EXPLORATION");
    expect(fantasyGraph.spatialPlan?.focalObject).toContain("island");
    expect(fantasyGraph.navigationModel).toMatch(/immersive-hud|playful-pill-dock/);
    expect(fantasyGraph.sections?.some(s => s.name.includes("Realm") || s.name.includes("Companions"))).toBe(true);

    // 4. Futuristic Sneaker Launch
    const sneakerPrompt = "Build a futuristic sneaker launch experience with 3D product turntable and dynamic materials";
    const sneakerCap = ExperienceCapabilityResolver.resolve(sneakerPrompt);
    const sneakerGraph = ExperienceArchitect.designComposition({
      prompt: sneakerPrompt,
      productTitle: "Apex Velocity",
      primaryActivity: "Sneaker Customization & 3D Drop Showcase",
      experienceType: sneakerCap.experienceType,
      real3dRequired: sneakerCap.real3dRequired,
    });

    expect(sneakerGraph.spatialPlan?.sceneType).toBe("PRODUCT_STAGE");
    expect(sneakerGraph.spatialPlan?.focalObject).toContain("sneaker");
    expect(sneakerGraph.navigationModel).toBe("kinetic-corner-hud");

    // PROOF: All 4 have completely distinct structural fingerprints and navigation models!
    const fingerprints = new Set([
      perfumeGraph.structuralFingerprint,
      spaceGraph.structuralFingerprint,
      fantasyGraph.structuralFingerprint,
      sneakerGraph.structuralFingerprint,
    ]);
    expect(fingerprints.size).toBe(4);

    const navModels = new Set([
      perfumeGraph.navigationModel,
      spaceGraph.navigationModel,
      fantasyGraph.navigationModel,
      sneakerGraph.navigationModel,
    ]);
    expect(navModels.size).toBe(4);
  });

  it("generates editorial monograph composition for magazine prompts rather than cards", () => {
    const prompt = "An independent architectural monograph magazine with longform essays, design theory, and marginalia";
    const cap = ExperienceCapabilityResolver.resolve(prompt);
    const graph = ExperienceArchitect.designComposition({
      prompt,
      productTitle: "Form & Void",
      primaryActivity: "Architectural Criticism & Longform Reading",
      experienceType: cap.experienceType,
    });

    expect(graph.layoutTopology).toBe("EDITORIAL_LANDING");
    expect(graph.navigationModel).toBe("minimal-top-masthead");
    expect(graph.cardDensityRatio).toBeLessThanOrEqual(0.15);
    expect(graph.forbiddenTemplates).toContain("GenericCardGrid");
  });

  it("generates retail commerce composition for bakery storefront with sliding cart drawer", () => {
    const prompt = "An artisan organic sourdough bakery with daily fresh loaves, custom cake configurator, and morning pickup";
    const cap = ExperienceCapabilityResolver.resolve(prompt);
    const graph = ExperienceArchitect.designComposition({
      prompt,
      productTitle: "Hearth & Crumb",
      primaryActivity: "Artisan Baked Goods Ordering",
      experienceType: cap.experienceType,
    });

    expect(graph.layoutTopology).toBe("PORTAL_HERO_SHOWCASE");
    expect(graph.navigationModel).toBe("top-nav-cart");
    expect(graph.sections?.some(s => s.name.includes("Catalog") || s.name.includes("Hearth") || s.name.includes("Bakes"))).toBe(true);
    expect(graph.forbiddenTemplates).toContain("DashboardTemplate");
  });

  it("generates hospitality sanctuary composition for luxury resort", () => {
    const prompt = "A luxury private island resort and sanctuary with overwater villas, Michelin dining, and wellness rituals";
    const cap = ExperienceCapabilityResolver.resolve(prompt);
    const graph = ExperienceArchitect.designComposition({
      prompt,
      productTitle: "Aura Atoll Sanctuary",
      primaryActivity: "Luxury Villa Booking & Experience Reservation",
      experienceType: cap.experienceType,
    });

    expect(graph.layoutTopology).toBe("PORTAL_HERO_SHOWCASE");
    expect(graph.navigationModel).toBe("floating-pill");
    expect(graph.sections?.some(s => s.name.includes("Suites") || s.name.includes("Sanctuary") || s.name.includes("Hero"))).toBe(true);
  });

  it("regenerates a divergent composition when user requests 'too generic / make it completely different'", () => {
    const prompt = "A plant watering tracker and botanical journal";
    const initialGraph = ExperienceArchitect.designComposition({
      prompt,
      productTitle: "Sprout Tracker",
      primaryActivity: "Plant Care",
    });

    const redesignedGraph = ExperienceArchitect.regenerateDivergent(initialGraph, {
      prompt,
      productTitle: "Sprout Tracker",
      primaryActivity: "Plant Care",
    });

    // Redesigned graph must have an altered fingerprint and layout topology
    expect(redesignedGraph.structuralFingerprint).not.toBe(initialGraph.structuralFingerprint);
    expect(redesignedGraph.layoutTopology).not.toBe(initialGraph.layoutTopology);
  });
});
