import { describe, it, expect } from "vitest";
import {
  CompositionVariantResolver,
  CompositionConvergenceGate,
} from "../../index.js";
import { DomainVisualDesignContractDeriver } from "../../design/domain-visual-contract.js";

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

      return {
        domain: d.name,
        route: d.route,
        capability: "SCROLL_STORY",
        composition,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("SCROLL_STORY", samples);
    console.log("TEST A (SCROLL_STORY) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);

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

      return {
        domain: d.name,
        route: d.route,
        capability: "SPATIAL_MAP",
        composition,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("SPATIAL_MAP", samples);
    console.log("TEST B (SPATIAL_MAP) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);
  });

  it("TEST C: Generate 5 IMMERSIVE_3D pages across unrelated domains -> at least 3 distinct structural fingerprints", () => {
    const d3Domains = [
      { name: "Atelier Chronos", prompt: "Haute horlogerie tourbillon escapement kinetic 3D exploded viewer", route: "/escapement", seed: 11 },
      { name: "AeroStratos", prompt: "Supersonic carbon-composite wing structural airframe 3D inspection", route: "/airframe", seed: 22 },
      { name: "Atelier Oakhaven", prompt: "Handcrafted white oak joinery dining table 3D studio configurator", route: "/table", seed: 33 },
      { name: "Kazzoo World", prompt: "3D claymation animated fantasy character showcase with companion turntable", route: "/avatar", seed: 44 },
      { name: "Abyssal Specimen", prompt: "Deep-sea hydrothermal bioluminescent siphonophore specimen 3D plinth", route: "/specimen", seed: 55 },
    ];

    const samples = d3Domains.map(d => {
      const composition = CompositionVariantResolver.resolve({
        brandName: d.name,
        prompt: d.prompt,
        route: d.route,
        experienceCapability: "IMMERSIVE_3D",
        seed: d.seed,
      });

      return {
        domain: d.name,
        route: d.route,
        capability: "IMMERSIVE_3D",
        composition,
      };
    });

    const report = CompositionConvergenceGate.auditCapabilitySamples("IMMERSIVE_3D", samples);
    console.log("TEST C (IMMERSIVE_3D) Distribution:", report.fingerprintDistribution);

    expect(report.distinctFingerprints).toBeGreaterThanOrEqual(3);
    expect(report.passed).toBe(true);
  });

  it("TEST D: Same semantic page + same seed = 100% deterministic reproducibility", () => {
    const prompt = "Handcrafted artisan timber furniture studio";
    const comp1 = CompositionVariantResolver.resolve({
      brandName: "Atelier",
      route: "/turntable",
      prompt,
      seed: 777,
      experienceCapability: "IMMERSIVE_3D",
    });

    const comp2 = CompositionVariantResolver.resolve({
      brandName: "Atelier",
      route: "/turntable",
      prompt,
      seed: 777,
      experienceCapability: "IMMERSIVE_3D",
    });

    expect(comp1.structuralFingerprint).toBe(comp2.structuralFingerprint);
    expect(comp1.id).toBe(comp2.id);
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

    expect(compA.capability).toBe("SCROLL_STORY");
    expect(compB.capability).toBe("SCROLL_STORY");
    expect(compA.id).not.toBe(compB.id);
  });

  it("TEST F: Unseen domains have 0 vocabulary leaks and 0 hardcoded fallback strings in contracts", () => {
    const furnitureContract = DomainVisualDesignContractDeriver.derive("Luxury handcrafted wood furniture studio with 3D turntable");
    const furnitureJson = JSON.stringify(furnitureContract).toLowerCase();

    expect(furnitureJson).not.toContain("emerald glade");
    expect(furnitureJson).not.toContain("abyssal trench");
    expect(furnitureJson).not.toContain("kazzoo");
    expect(furnitureJson).not.toContain("brambletoad");

    const oceanContract = DomainVisualDesignContractDeriver.derive("Deep ocean benthic trench exploration map with bathymetric drop-offs");
    const oceanJson = JSON.stringify(oceanContract).toLowerCase();

    expect(oceanJson).not.toContain("kazzoo");
    expect(oceanJson).not.toContain("appalachian");
    expect(oceanJson).not.toContain("diamond wheel");
  });
});
