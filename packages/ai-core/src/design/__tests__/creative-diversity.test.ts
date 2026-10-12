import { describe, it, expect, beforeEach } from "vitest";
import { ExperienceArchitect } from "../experience-architect.js";
import { ExperienceCapabilityResolver } from "../experience-capability-plan.js";
import { NavigationDesignResolver } from "../navigation-design.js";
import { ProductExperiencePlanManager } from "../product-experience-plan.js";
import { GenerationSeedManager } from "../generation-seed.js";
import { CanonicalArchitectureState } from "../../governance/canonical-architecture-state.js";
import { ProductUnderstanding } from "../product-understanding.js";
import { CandidateCompositionSynthesizer } from "../candidate-composition-synthesizer.js";

const KAZZOO_PROMPT =
  "Build Kazzoo, an immersive 3D claymation fantasy adventure universe with clay characters, voice lines, quest map, soundboard, and journey scroll";

const WATCH_PROMPT =
  "Build an ultra-luxury mechanical horology atelier showcasing tourbillon calibers, craftsmanship, and bespoke private viewing";

const ARCHITECTURE_PROMPT =
  "Build a brutalist architecture monograph and journal exploring spatial form, concrete materiality, and architect case studies";

const SOLAR_PROMPT =
  "Build a real-time solar telemetry dashboard monitoring orbital PV arrays, grid dispatch, and energy flux metrics";

describe("Creative Diversity & Deterministic Reproducibility", () => {
  beforeEach(() => {
    CanonicalArchitectureState.getInstance().reset();
  });

  it("1. Same prompt with different seeds generates diverse, valid compositions while locking product requirements", () => {
    const cap = ExperienceCapabilityResolver.resolve(KAZZOO_PROMPT);
    expect(cap.real3dRequired).toBe(true);
    expect(cap.experienceType).toBe("IMMERSIVE_3D");

    // Seeds chosen to trigger different modulo branches among the 5 valid fantasy strategies:
    // WORLD_EXPLORATION, CINEMATIC_JOURNEY, SPATIAL_ATLAS, CHARACTER_STAGE, INTERACTIVE_REALM
    const seedA = 101; // 101 % 5 = 1 -> CINEMATIC_JOURNEY
    const seedB = 103; // 103 % 5 = 3 -> CHARACTER_STAGE
    const seedC = 100; // 100 % 5 = 0 -> WORLD_EXPLORATION

    const graphA = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy Adventure & Quest Exploration",
      experienceType: cap.experienceType,
      real3dRequired: cap.real3dRequired,
      generationSeed: seedA,
    });

    const graphB = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy Adventure & Quest Exploration",
      experienceType: cap.experienceType,
      real3dRequired: cap.real3dRequired,
      generationSeed: seedB,
    });

    const graphC = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy Adventure & Quest Exploration",
      experienceType: cap.experienceType,
      real3dRequired: cap.real3dRequired,
      generationSeed: seedC,
    });

    // 1. All three satisfy locked product requirements (3D, Kazzoo identity, spatial scene)
    expect(graphA.spatialPlan).toBeDefined();
    expect(graphB.spatialPlan).toBeDefined();
    expect(graphC.spatialPlan).toBeDefined();
    expect(graphA.spatialPlan?.focalObject).toMatch(/island|path|valley|stage|companion|landmark/i);
    expect(graphB.spatialPlan?.focalObject).toMatch(/island|path|valley|stage|companion|landmark/i);
    expect(graphC.spatialPlan?.focalObject).toMatch(/island|path|valley|stage|companion|landmark/i);

    // 2. Creative realizations differ meaningfully
    expect(graphA.compositionStrategy).toBe("CINEMATIC_JOURNEY");
    expect(graphB.compositionStrategy).toBe("CHARACTER_STAGE");
    expect(graphC.compositionStrategy).toBe("WORLD_EXPLORATION");

    // Camera angles & choreographies differ
    expect(graphA.spatialPlan?.cameraStrategy).not.toBe(graphB.spatialPlan?.cameraStrategy);
    expect(graphB.spatialPlan?.cameraStrategy).not.toBe(graphC.spatialPlan?.cameraStrategy);

    // Structural fingerprints differ
    const fingerprints = new Set([
      graphA.structuralFingerprint,
      graphB.structuralFingerprint,
      graphC.structuralFingerprint,
    ]);
    expect(fingerprints.size).toBe(3);

    // 3. Navigation models adapt to the composition strategy
    const navA = NavigationDesignResolver.resolve(
      KAZZOO_PROMPT,
      "immersive-experience",
      "KAZZOO",
      "Claymation Fantasy",
      [],
      "playful",
      seedA,
      graphA.compositionStrategy
    );
    const navB = NavigationDesignResolver.resolve(
      KAZZOO_PROMPT,
      "immersive-experience",
      "KAZZOO",
      "Claymation Fantasy",
      [],
      "playful",
      seedB,
      graphB.compositionStrategy
    );
    const navC = NavigationDesignResolver.resolve(
      KAZZOO_PROMPT,
      "immersive-experience",
      "KAZZOO",
      "Claymation Fantasy",
      [],
      "playful",
      seedC,
      graphC.compositionStrategy
    );

    expect(navA.model).toBe("floating_pills");
    expect(navB.model).toBe("bottom_dock");
    expect(navC.model).toBe("immersive_hud");

    // All navigations still maintain Kazzoo brand and primary routes
    expect(navA.brandTreatment.name).toBe("KAZZOO");
    expect(navB.brandTreatment.name).toBe("KAZZOO");
    expect(navC.brandTreatment.name).toBe("KAZZOO");
    expect(navA.primaryItems.some(i => i.label === "Quests")).toBe(true);
    expect(navB.primaryItems.some(i => i.label === "Quests")).toBe(true);
    expect(navC.primaryItems.some(i => i.label === "Quests")).toBe(true);
  });

  it("2. Same prompt with same seed is 100% deterministically reproducible", () => {
    const fixedSeed = 12345;

    // Run 1
    const cap1 = ExperienceCapabilityResolver.resolve(KAZZOO_PROMPT);
    const graph1 = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy Adventure",
      experienceType: cap1.experienceType,
      real3dRequired: cap1.real3dRequired,
      generationSeed: fixedSeed,
    });
    const nav1 = NavigationDesignResolver.resolve(
      KAZZOO_PROMPT,
      "immersive-experience",
      "KAZZOO",
      "Claymation Fantasy",
      [],
      "playful",
      fixedSeed,
      graph1.compositionStrategy
    );
    const fp1 = NavigationDesignResolver.computeFingerprint(nav1);

    // Run 2
    const cap2 = ExperienceCapabilityResolver.resolve(KAZZOO_PROMPT);
    const graph2 = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy Adventure",
      experienceType: cap2.experienceType,
      real3dRequired: cap2.real3dRequired,
      generationSeed: fixedSeed,
    });
    const nav2 = NavigationDesignResolver.resolve(
      KAZZOO_PROMPT,
      "immersive-experience",
      "KAZZOO",
      "Claymation Fantasy",
      [],
      "playful",
      fixedSeed,
      graph2.compositionStrategy
    );
    const fp2 = NavigationDesignResolver.computeFingerprint(nav2);

    expect(graph1.structuralFingerprint).toBe(graph2.structuralFingerprint);
    expect(graph1.compositionStrategy).toBe(graph2.compositionStrategy);
    expect(graph1.spatialPlan?.cameraStrategy).toBe(graph2.spatialPlan?.cameraStrategy);
    expect(nav1.model).toBe(nav2.model);
    expect(nav1.interactionModel).toBe(nav2.interactionModel);
    expect(fp1.fingerprintHash).toBe(fp2.fingerprintHash);
  });

  it("3. Same seed does NOT force same website structure across different product domains", () => {
    const sharedSeed = 424242;

    const kazzooCap = ExperienceCapabilityResolver.resolve(KAZZOO_PROMPT);
    const watchCap = ExperienceCapabilityResolver.resolve(WATCH_PROMPT);
    const archCap = ExperienceCapabilityResolver.resolve(ARCHITECTURE_PROMPT);
    const solarCap = ExperienceCapabilityResolver.resolve(SOLAR_PROMPT);

    const kazzooGraph = ExperienceArchitect.designComposition({
      prompt: KAZZOO_PROMPT,
      productTitle: "Kazzoo",
      primaryActivity: "Claymation Fantasy",
      experienceType: kazzooCap.experienceType,
      real3dRequired: kazzooCap.real3dRequired,
      generationSeed: sharedSeed,
    });

    const watchGraph = ExperienceArchitect.designComposition({
      prompt: WATCH_PROMPT,
      productTitle: "Chronos Atelier",
      primaryActivity: "Haute Horology Showcase",
      experienceType: watchCap.experienceType,
      real3dRequired: watchCap.real3dRequired,
      generationSeed: sharedSeed,
    });

    const archGraph = ExperienceArchitect.designComposition({
      prompt: ARCHITECTURE_PROMPT,
      productTitle: "Tectonic Journal",
      primaryActivity: "Architectural Monograph & Case Studies",
      experienceType: archCap.experienceType,
      real3dRequired: archCap.real3dRequired,
      generationSeed: sharedSeed,
    });

    const solarGraph = ExperienceArchitect.designComposition({
      prompt: SOLAR_PROMPT,
      productTitle: "SolarPulse",
      primaryActivity: "Telemetry Operations",
      experienceType: solarCap.experienceType,
      real3dRequired: solarCap.real3dRequired,
      generationSeed: sharedSeed,
    });

    // 1. Domains dominate over the seed:
    expect(kazzooCap.experienceType).toBe("IMMERSIVE_3D");
    expect(watchCap.experienceType).toBe("IMMERSIVE_3D");
    expect(archCap.experienceType).toBe("EDITORIAL");
    expect(solarCap.experienceType).toBe("DASHBOARD");

    // 2. Spatial plans differ completely between Kazzoo and Watch:
    expect(kazzooGraph.spatialPlan?.focalObject).toMatch(/island|claymation|fantasy|valley|stage|companion/i);
    expect(watchGraph.spatialPlan?.focalObject).toMatch(/caliber|tourbillon|horology|watch/i);

    // 3. Topologies are domain-appropriate:
    expect(archGraph.layoutTopology).toBe("EDITORIAL_LANDING");
    expect(solarGraph.layoutTopology).toBe("OPERATIONAL_COMMAND_CONSOLE");

    // 4. All 4 structural fingerprints are completely distinct:
    const fingerprints = new Set([
      kazzooGraph.structuralFingerprint,
      watchGraph.structuralFingerprint,
      archGraph.structuralFingerprint,
      solarGraph.structuralFingerprint,
    ]);
    expect(fingerprints.size).toBe(4);
  });

  it("4. GenerationSeedManager correctly resolves modes and preserves explicit seeds", () => {
    // Mode = deterministic
    const det1 = GenerationSeedManager.resolveSeed({
      mode: "deterministic",
      prompt: "Build an art gallery",
    });
    const det2 = GenerationSeedManager.resolveSeed({
      mode: "deterministic",
      prompt: "Build an art gallery",
    });
    expect(det1.mode).toBe("deterministic");
    expect(det1.seed).toBe(det2.seed);

    // Mode = creative (default) -> should give valid non-zero seed
    const creative1 = GenerationSeedManager.resolveSeed({
      mode: "creative",
      prompt: "Build an art gallery",
    });
    expect(creative1.mode).toBe("creative");
    expect(creative1.seed).toBeGreaterThan(0);

    // Explicit seed (--seed 9999)
    const explicit = GenerationSeedManager.resolveSeed({
      mode: "creative",
      explicitSeed: 9999,
      prompt: "Build an art gallery",
    });
    expect(explicit.seed).toBe(9999);
  });

  it("5. Unseen domains synthesize valid, domain-appropriate candidate compositions without hardcoded branches", () => {
    // Domain 1: 3D Spatial Unseen Domain (Underwater Science Museum)
    const underwaterPrompt = "Abyssal Deep: An immersive 3D interactive underwater science museum exploring hydrothermal vents, deep-sea bioluminescence, and submersible research missions. Features: submersible explorer, depth bathymetry map, specimen bios with acoustic calls, hydrophone soundboard, expedition logbook.";
    const underwaterChars = ProductUnderstanding.analyze(underwaterPrompt);
    const underwaterCaps = ExperienceCapabilityResolver.resolve(underwaterPrompt, underwaterChars);

    const underwaterCandidates = CandidateCompositionSynthesizer.generateCandidates({
      prompt: underwaterPrompt,
      characteristics: underwaterChars,
      capabilityPlan: underwaterCaps,
      generationSeed: 42,
    });

    expect(underwaterCandidates.length).toBe(5);
    // Spot check candidate strategies:
    const candidateStrategies = underwaterCandidates.map(c => c.strategyId);
    expect(candidateStrategies).toContain("WORLD_EXPLORATION");
    expect(candidateStrategies).toContain("CINEMATIC_JOURNEY");
    expect(candidateStrategies).toContain("SPATIAL_ATLAS");

    // Spot check domain adaptation:
    const expedition = underwaterCandidates.find(c => c.strategyId === "WORLD_EXPLORATION")!;
    expect(expedition.spatialPlan?.focalObject).toMatch(/hydrothermal|submersible|marine|abyssal/i);
    expect(expedition.spatialPlan?.lightingModel).toMatch(/bioluminescent|underwater|ocean/i);

    // Check Navigation derivation for unseen domain:
    const underwaterNav = NavigationDesignResolver.resolve(
      underwaterPrompt,
      "IMMERSIVE_3D",
      "Abyssal Deep",
      "Underwater Science Museum",
      [],
      "mysterious",
      42,
      "WORLD_EXPLORATION"
    );
    const labels = underwaterNav.primaryItems.map(i => i.label);
    expect(labels).toContain("Specimens");
    expect(labels).toContain("Hydrophone");
    expect(labels).toContain("Logbook");

    // Domain 2: Non-Spatial Unseen Domain (Luxury Architectural Furniture Studio)
    const furniturePrompt = "Solstice Atelier: High-end bespoke architectural furniture showroom with modular seating suites, sustainable timber joinery, and private consultations. Features: modular room catalog, joinery craft timeline, timber swatch laboratory, consultation booking.";
    const furnitureChars = ProductUnderstanding.analyze(furniturePrompt);
    const furnitureCaps = ExperienceCapabilityResolver.resolve(furniturePrompt, furnitureChars);

    const furnitureCandidates = CandidateCompositionSynthesizer.generateCandidates({
      prompt: furniturePrompt,
      characteristics: furnitureChars,
      capabilityPlan: furnitureCaps,
      generationSeed: 77,
    });

    expect(furnitureCandidates.length).toBe(3);
    const furnitureStrategies = furnitureCandidates.map(c => c.strategyId);
    expect(furnitureStrategies).toContain("EDITORIAL_CHRONICLE");
    expect(furnitureStrategies).toContain("CURATED_SHOWCASE");
  });
});
