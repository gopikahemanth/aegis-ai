import { describe, it, expect } from "vitest";
import {
  GenericExperienceGenerator,
  CompositionVariantResolver,
  CompositionConvergenceGate,
  DomainVocabularySynthesizer,
} from "../../index.js";

describe("Aegis Generative Composition Architecture & Convergence Gate", () => {
  const domains = [
    {
      name: "Atelier Oakhaven",
      prompt: "Luxury handcrafted wood furniture studio and joinery configurator with 3D timber turntable and mortise chronicle",
      route: "/joinery-chronicle",
      seed: 101,
    },
    {
      name: "Mariana Abyss Lab",
      prompt: "Deep-sea underwater oceanography research institute with benthic exploration maps and dive chronicles",
      route: "/expedition-chronicle",
      seed: 202,
    },
    {
      name: "CineSphere Fest",
      prompt: "International auteur independent film festival with screening schedule and director documentary chronicle",
      route: "/director-chronicle",
      seed: 303,
    },
    {
      name: "TerraClim Telemetry",
      prompt: "Planetary climate analytics and glacial shift telemetry platform with geological history chronicle",
      route: "/geological-chronicle",
      seed: 404,
    },
    {
      name: "Harmonic Playground",
      prompt: "Playful children's whimsical musical world with acoustic adventures and bedtime audio story chronicle",
      route: "/family-adventures",
      seed: 505,
    },
  ];

  it("TEST A: Generate 5 SCROLL_STORY pages across unrelated domains -> at least 3 distinct structural fingerprints", () => {
    const samples = domains.map(d => {
      const composition = CompositionVariantResolver.resolve({
        brandName: d.name,
        prompt: d.prompt,
        route: d.route,
        experienceCapability: "SCROLL_STORY",
        seed: d.seed,
      });

      const code = GenericExperienceGenerator.generate({
        componentName: "StoryPage",
        brandName: d.name,
        route: d.route,
        prompt: d.prompt,
        seed: d.seed,
        experienceCapability: "SCROLL_STORY",
        composition,
      });

      return {
        domain: d.name,
        route: d.route,
        capability: "SCROLL_STORY",
        composition,
        code,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("SCROLL_STORY", samples);
    console.log("TEST A (SCROLL_STORY) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);

    // Verify generated code contains different layout topologies
    const topologies = samples.map(s => s.composition.sectionTopology);
    const uniqueTopologies = new Set(topologies);
    expect(uniqueTopologies.size).toBeGreaterThanOrEqual(3);
  });

  it("TEST B: Generate 5 SPATIAL_MAP pages across unrelated domains -> at least 3 distinct structural fingerprints", () => {
    const mapDomains = [
      { name: "Mariana Trench", prompt: "Deep ocean benthic trench exploration map with bathymetric drop-offs", route: "/dive-map", seed: 111 },
      { name: "Alpine Trailways", prompt: "High altitude vertical mountain ascent trail and peak expedition map", route: "/ascent-trail", seed: 222 },
      { name: "CineSphere Fest", prompt: "Festival venue layout, stage screening halls, and attendee waypoints", route: "/venue-map", seed: 333 },
      { name: "Atelier Oakhaven", prompt: "Aged timber harvest forests, sustainable logging coordinates, and oak reserves", route: "/forest-map", seed: 444 },
      { name: "Solaris Radar", prompt: "Orbital celestial station with planetary radar sweep and telemetry hubs", route: "/constellation-map", seed: 555 },
    ];

    const samples = mapDomains.map(d => {
      const composition = CompositionVariantResolver.resolve({
        brandName: d.name,
        prompt: d.prompt,
        route: d.route,
        experienceCapability: "SPATIAL_MAP",
        seed: d.seed,
      });

      const code = GenericExperienceGenerator.generate({
        componentName: "MapPage",
        brandName: d.name,
        route: d.route,
        prompt: d.prompt,
        seed: d.seed,
        experienceCapability: "SPATIAL_MAP",
        composition,
      });

      return {
        domain: d.name,
        route: d.route,
        capability: "SPATIAL_MAP",
        composition,
        code,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("SPATIAL_MAP", samples);
    console.log("TEST B (SPATIAL_MAP) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);
  });

  it("TEST C: Generate 5 IMMERSIVE_3D pages across unrelated domains -> at least 3 distinct structural fingerprints", () => {
    const d3Domains = [
      { name: "Atelier Oakhaven", prompt: "Luxury handcrafted wood furniture studio and joinery configurator turntable", route: "/turntable", seed: 12 },
      { name: "Deep Ocean Lab", prompt: "Autonomous benthic submersible vehicle spatial viewer", route: "/submersible-3d", seed: 34 },
      { name: "Kazzoo Realm", prompt: "Playful 3D archipelago fantasy world exploration mound", route: "/world-stage", seed: 56 },
      { name: "Chrono Timepieces", prompt: "Luxury mechanical watch atelier centerpiece plinth showcase", route: "/timepiece-3d", seed: 78 },
      { name: "Auteur Cinema", prompt: "Anamorphic camera stage optical 3D configurator", route: "/optics-3d", seed: 90 },
    ];

    const samples = d3Domains.map(d => {
      const composition = CompositionVariantResolver.resolve({
        brandName: d.name,
        prompt: d.prompt,
        route: d.route,
        experienceCapability: "IMMERSIVE_3D",
        seed: d.seed,
      });

      const code = GenericExperienceGenerator.generate({
        componentName: "ThreeDPage",
        brandName: d.name,
        route: d.route,
        prompt: d.prompt,
        seed: d.seed,
        experienceCapability: "IMMERSIVE_3D",
        composition,
      });

      return {
        domain: d.name,
        route: d.route,
        capability: "IMMERSIVE_3D",
        composition,
        code,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("IMMERSIVE_3D", samples);
    console.log("TEST C (IMMERSIVE_3D) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);
  });

  it("TEST D: Same semantic page + same seed = 100% deterministic reproducibility", () => {
    const prompt = "Handcrafted artisan timber furniture studio";
    const run1 = GenericExperienceGenerator.generate({
      componentName: "TurntableA",
      brandName: "Atelier",
      route: "/turntable",
      prompt,
      seed: 777,
      experienceCapability: "IMMERSIVE_3D",
    });

    const run2 = GenericExperienceGenerator.generate({
      componentName: "TurntableA",
      brandName: "Atelier",
      route: "/turntable",
      prompt,
      seed: 777,
      experienceCapability: "IMMERSIVE_3D",
    });

    expect(run1).toBe(run2);
  });

  it("TEST E: Same capability + different seed = distinct valid compositions", () => {
    const compA = CompositionVariantResolver.resolve({
      brandName: "Studio",
      prompt: "Interactive visual story",
      route: "/story",
      experienceCapability: "SCROLL_STORY",
      seed: 101,
    });

    const compB = CompositionVariantResolver.resolve({
      brandName: "Studio",
      prompt: "Interactive visual story",
      route: "/story",
      experienceCapability: "SCROLL_STORY",
      seed: 202,
    });

    // Both must be valid SCROLL_STORY compositions
    expect(compA.capability).toBe("SCROLL_STORY");
    expect(compB.capability).toBe("SCROLL_STORY");
    // Seeds 101 and 202 choose different valid compositions
    expect(compA.id).not.toBe(compB.id);
  });

  it("TEST F: Unseen domains have 0 vocabulary leaks and 0 hardcoded fallback strings", () => {
    const furnitureCode = GenericExperienceGenerator.generate({
      componentName: "FurnitureViewer",
      brandName: "Atelier Oakhaven",
      route: "/turntable",
      prompt: "Luxury handcrafted wood furniture studio with 3D turntable",
      seed: 42,
      experienceCapability: "IMMERSIVE_3D",
    });

    // Zero Kazzoo or ocean leaks in furniture
    expect(furnitureCode).not.toContain("Emerald Glade");
    expect(furnitureCode).not.toContain("Abyssal Trench");
    expect(furnitureCode).not.toContain("Kazzoo");
    expect(furnitureCode).not.toContain("Brambletoad");
    expect(furnitureCode).toContain("Heartwood Calibrator");

    const furnitureMapCode = GenericExperienceGenerator.generate({
      componentName: "FurnitureMap",
      brandName: "Atelier Oakhaven",
      route: "/forest-reserves",
      prompt: "Sustainable timber forest reserves and quarter-sawn oak harvesting",
      seed: 42,
      experienceCapability: "SPATIAL_MAP",
    });

    // Zero generic sci-fi leaks in furniture map
    expect(furnitureMapCode).not.toContain("Sector Meridian Ridge");
    expect(furnitureMapCode).not.toContain("Primary Observation Hub");
    expect(furnitureMapCode).toContain("Old Growth Oak Reserve");
    expect(furnitureMapCode).toContain("Kiln Curing Yard");

    const oceanCode = GenericExperienceGenerator.generate({
      componentName: "OceanViewer",
      brandName: "Mariana Lab",
      route: "/abyss-stage",
      prompt: "Deep ocean benthic submersible exploration",
      seed: 42,
      experienceCapability: "IMMERSIVE_3D",
    });

    // Zero furniture or Kazzoo leaks in ocean
    expect(oceanCode).not.toContain("Emerald Glade");
    expect(oceanCode).not.toContain("Timber");
    expect(oceanCode).toContain("Pelagic Abyss Stage");
  });

  it("TEST G: Two routes in the same product using the same capability do not duplicate each other", () => {
    // Kazzoo /family-adventures vs /print-journey-scroll
    const adventureCode = GenericExperienceGenerator.generate({
      componentName: "FamilyAdventures",
      brandName: "Kazzoo",
      route: "/family-adventures",
      pageRole: "Family Adventures Lore",
      purpose: "Family Adventures Chapter Story",
      prompt: "Whimsical children's 3D fantasy world",
      seed: 42,
      experienceCapability: "SCROLL_STORY",
    });

    const printScrollCode = GenericExperienceGenerator.generate({
      componentName: "PrintJourneyScroll",
      brandName: "Kazzoo",
      route: "/print-journey-scroll",
      pageRole: "Print Journey Keepsake Scroll",
      purpose: "Printable Keepsake Folio and Pilgrim Inscriptions",
      prompt: "Whimsical children's 3D fantasy world",
      seed: 42,
      experienceCapability: "SCROLL_STORY",
    });

    // The two routes MUST NOT produce identical code or identical chapter lore
    expect(adventureCode).not.toBe(printScrollCode);
    expect(adventureCode).toContain("The Whispering Awakening");
    expect(printScrollCode).toContain("The Pilgrim's Parchment Inscription");
    expect(printScrollCode).toContain("Keepsake Folio");
  });
});
