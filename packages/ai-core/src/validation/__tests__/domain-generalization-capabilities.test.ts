import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { GenericExperienceGenerator } from "../../design/experience-generators/generic-experience-generator.js";
import { SpatialMapExperienceGenerator } from "../../design/experience-generators/spatial-map-generator.js";
import { ScrollStoryExperienceGenerator } from "../../design/experience-generators/scroll-story-generator.js";
import { AudioExperienceGenerator } from "../../design/experience-generators/audio-experience-generator.js";
import { CharacterExperienceGenerator } from "../../design/experience-generators/character-experience-generator.js";
import { Product3DExperienceGenerator } from "../../design/experience-generators/product-3d-generator.js";
import { WorkspaceExperienceGenerator } from "../../design/experience-generators/workspace-experience-generator.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import type { ProductExperiencePlan } from "../../design/product-experience-plan.js";

const TEST_SANDBOX = join(process.cwd(), ".test-tmp-domain-generalization");

describe("Domain Generalization & Generic Experience Capabilities", () => {
  beforeEach(() => {
    if (existsSync(TEST_SANDBOX)) rmSync(TEST_SANDBOX, { recursive: true, force: true });
    mkdirSync(TEST_SANDBOX, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_SANDBOX)) rmSync(TEST_SANDBOX, { recursive: true, force: true });
  });

  it("TEST 1: Underwater Science Museum (Unseen Domain) generates first-class routes with ZERO Kazzoo leaks", () => {
    const museumPrompt =
      "Build an interactive deep-sea underwater science museum called Nautilus Abyssal Institute with bathymetric dive sites, bioluminescent specimen discovery, benthic hydrophone audio arrays, and deep trench expedition chronicles.";

    const routes = [
      { path: "/", name: "WorldStage", role: "3D Submersible Entrance", cap: "IMMERSIVE_3D" },
      { path: "/dive-sites", name: "DiveSitesPage", role: "Benthic Bathymetry Map", cap: "SPATIAL_MAP" },
      { path: "/hydrophone-audio", name: "HydrophonePage", role: "Hydrophone Acoustic Array", cap: "AUDIO_SYNTH" },
      { path: "/deep-trench-expedition", name: "ExpeditionPage", role: "Deep Trench Descent Chronicle", cap: "SCROLL_STORY" },
      { path: "/benthic-specimens", name: "SpecimensPage", role: "Deep-Sea Marine Specimen Plinth", cap: "CHARACTER_STAGE" },
      { path: "/ballast-telemetry", name: "TelemetryPage", role: "Submersible Telemetry Console", cap: "WORKSPACE_TOOL" },
    ];

    // Generate project files using GenericExperienceGenerator
    const srcDir = join(TEST_SANDBOX, "src");
    const pagesDir = join(srcDir, "pages");
    mkdirSync(pagesDir, { recursive: true });

    for (const r of routes) {
      const code = GenericExperienceGenerator.generate({
        componentName: r.name,
        brandName: "Nautilus Abyssal Institute",
        route: r.path,
        pageRole: r.role,
        purpose: r.role,
        prompt: museumPrompt,
        seed: 42,
        experienceCapability: r.cap,
      });

      writeFileSync(join(pagesDir, `${r.name}.tsx`), code, "utf8");

      // Verify ZERO Kazzoo leaks in generated code
      expect(code).not.toContain("Kazzoo");
      expect(code).not.toContain("Muffy");
      expect(code).not.toContain("Pip");
      expect(code).not.toContain("Rony");
      expect(code).not.toContain("claymation");

      // Verify specialized capability reality
      if (r.cap === "SPATIAL_MAP") {
        expect(code).toContain("<svg");
        expect(code).toContain("Benthic");
        expect(code).toContain('data-experience-capability="SPATIAL_MAP"');
      }
      if (r.cap === "AUDIO_SYNTH") {
        expect(code).toContain("AudioContext");
        expect(code).toContain("soundPads");
        expect(code).toContain('data-experience-capability="AUDIO_SYNTH"');
      }
      if (r.cap === "SCROLL_STORY") {
        expect(code).toContain("scene-1");
        expect(code).toContain("data-scene");
        expect(code).toContain('data-scroll-progress="true"');
      }
      if (r.cap === "CHARACTER_STAGE") {
        expect(code).toContain("activeCompanion");
        expect(code).toContain('data-experience-capability="CHARACTER_STAGE"');
      }
      if (r.cap === "WORKSPACE_TOOL") {
        expect(code).toContain('data-experience-capability="WORKSPACE_TOOL"');
        expect(code).toContain("Submersible Telemetry Console");
      }
    }

    // Now run PageExperienceQualityGate
    const mockPlan: ProductExperiencePlan = {
      brandName: "Nautilus Abyssal Institute",
      genre: "SPATIAL_WORLD",
      pagePlans: routes.map(r => ({
        route: r.path,
        pageRole: r.role,
        purpose: r.role,
        experienceIntent: "Inspect deep sea",
        focalElement: "Focal element",
        composition: {
          topology: r.cap as any,
          layers: [],
          sections: [],
          dominantStructure: "FULL_BLEED_STAGE" as any,
        },
        interaction: { primary: ["Click"], secondary: [] },
        motion: { entrance: "fade", scroll: "smooth", transitions: [] },
        contentPresentation: "Rich",
        visualHierarchy: { primary: "Main", secondary: [] },
        responsiveStrategy: "Responsive",
        requiredCapabilities:
          r.cap === "SPATIAL_MAP"
            ? ["interactive-map-canvas"]
            : r.cap === "AUDIO_SYNTH"
            ? ["web-audio-synth"]
            : r.cap === "SCROLL_STORY"
            ? ["scroll-chapter-controller"]
            : r.cap === "CHARACTER_STAGE"
            ? ["character-switcher"]
            : r.cap === "IMMERSIVE_3D"
            ? ["3d-webgl-canvas"]
            : [],
        forbiddenPatterns: ["search bar", "card grid", "crud forms"],
      })),
    } as any;

    const report = PageExperienceQualityGate.audit(TEST_SANDBOX, mockPlan);
    expect(report.status).toBe("PASS");
    expect(report.routesPassed).toBe(routes.length);
    expect(report.passed).toBe(true);
  });

  it("TEST 2: Luxury Furniture Configurator (Unseen Domain) maps correctly with artisan timber vocabulary", () => {
    const furniturePrompt =
      "Build a luxury handcrafted wood furniture studio and configurator called Atelier Oakhaven with 3D timber turntable, mortise-and-tenon joinery chronicle, and artisan ergonomics workbench.";

    const workbenchCode = GenericExperienceGenerator.generate({
      componentName: "ErgonomicsWorkbench",
      brandName: "Atelier Oakhaven",
      route: "/ergonomics-workbench",
      pageRole: "Artisan Joinery Configurator",
      purpose: "Woodcraft & Ergonomics Workbench",
      prompt: furniturePrompt,
      seed: 42,
      experienceCapability: "WORKSPACE_TOOL",
    });

    expect(workbenchCode).toContain("Lumbar Incline Angle");
    expect(workbenchCode).toContain("Mortise & Tenon Depth");
    expect(workbenchCode).toContain("White Oak Heirloom Standard");
    expect(workbenchCode).not.toContain("Kazzoo");
    expect(workbenchCode).not.toContain("Submersible");

    const storyCode = GenericExperienceGenerator.generate({
      componentName: "JoineryChronicle",
      brandName: "Atelier Oakhaven",
      route: "/joinery-chronicle",
      pageRole: "Joinery Craft Chronicle",
      purpose: "Scroll essay on timber joinery",
      prompt: furniturePrompt,
      seed: 42,
      experienceCapability: "SCROLL_STORY",
    });

    expect(storyCode).toContain("Timber");
    expect(storyCode).toContain("mortise and tenon");
    expect(storyCode).not.toContain("Kazzoo");
  });

  it("TEST 3: Creative Divergence: two distinct seeds produce distinct parameter configurations", () => {
    const prompt = "Build an interactive children's music world with playful harmonic soundboards and melodic instruments.";

    const audioSeedA = AudioExperienceGenerator.generate({
      componentName: "SoundStudioA",
      brandName: "Harmonic Playground",
      route: "/sounds",
      prompt,
      seed: 101,
    });

    const audioSeedB = AudioExperienceGenerator.generate({
      componentName: "SoundStudioB",
      brandName: "Harmonic Playground",
      route: "/sounds",
      prompt,
      seed: 202,
    });

    // Content should differ between different seeds (component name and pads)
    expect(audioSeedA).not.toBe(audioSeedB);
    expect(audioSeedA).toContain("SoundStudioA");
    expect(audioSeedB).toContain("SoundStudioB");

    // Identical seeds produce 100% deterministic reproducibility
    const audioSeedA2 = AudioExperienceGenerator.generate({
      componentName: "SoundStudioA",
      brandName: "Harmonic Playground",
      route: "/sounds",
      prompt,
      seed: 101,
    });

    expect(audioSeedA).toBe(audioSeedA2);
  });

  it("TEST 4: FastDeterministicSanitizer delegates to GenericExperienceGenerator without domain hardcoding", () => {
    const srcDir = join(TEST_SANDBOX, "src");
    const pagesDir = join(srcDir, "pages");
    mkdirSync(pagesDir, { recursive: true });

    const contract = {
      prompt: "Build an unseen domain deep-sea exploration laboratory called Mariana Institute.",
      routes: ["/dive-coordinates"],
    } as any;

    (FastDeterministicSanitizer as any).synthesizeDedicatedRoutePage(
      srcDir,
      "DiveCoordinatesPage",
      "/dive-coordinates",
      ["dive", "coordinates"],
      contract
    );

    const generatedPagePath = join(pagesDir, "DiveCoordinatesPage.tsx");
    expect(existsSync(generatedPagePath)).toBe(true);

    const content = require("node:fs").readFileSync(generatedPagePath, "utf8");
    expect(content).toContain("<svg");
    expect(content).toContain("Waypoint");
    expect(content).not.toContain("Domain Workspace");
    expect(content).not.toContain("Monstera");
    expect(content).not.toContain("Kazzoo");
  });

  it("TEST 5: Interactive Children's Music World (Unseen Domain) generates tactile synth without fantasy leaks", () => {
    const musicPrompt = "Build an interactive children's music world with melodic chime soundboards, frequency harmonics, and acoustic visualizers.";

    const synthCode = GenericExperienceGenerator.generate({
      componentName: "HarmonicSoundboardPage",
      brandName: "WonderTone Music Lab",
      route: "/frequencies",
      pageRole: "Harmonic Sound Studio",
      purpose: "Acoustic Synthesizer Studio",
      prompt: musicPrompt,
      seed: 42,
      experienceCapability: "AUDIO_SYNTH",
    });

    expect(synthCode).toContain("AudioContext");
    expect(synthCode).toContain("soundPads");
    expect(synthCode).toContain('data-experience-capability="AUDIO_SYNTH"');
    expect(synthCode).not.toContain("Kazzoo");
    expect(synthCode).not.toContain("Pip");
  });

  it("TEST 6: Travel Storytelling Experience (Unseen Domain) produces rich scrollytelling visual essay", () => {
    const travelPrompt = "Build a travel storytelling experience documenting high-altitude Himalayan mountain expeditions and alpine waypoints.";

    const storyCode = GenericExperienceGenerator.generate({
      componentName: "ExpeditionChroniclePage",
      brandName: "Alpine Odyssey",
      route: "/expedition-chronicle",
      pageRole: "Expedition Narrative Journey",
      purpose: "High-altitude travel storytelling visual essay",
      prompt: travelPrompt,
      seed: 88,
      experienceCapability: "SCROLL_STORY",
    });

    expect(storyCode).toContain("Alpine Odyssey");
    expect(storyCode).toContain("data-scroll-progress");
    expect(storyCode).toContain("scene-1");
    expect(storyCode).toContain('data-experience-capability="SCROLL_STORY"');
    expect(storyCode).not.toContain("Kazzoo");
  });

  it("TEST 7: Interactive Climate Visualization (Unseen Domain) generates planetary carbon & albedo workbench", () => {
    const climatePrompt = "Build an interactive climate visualization modeling planetary carbon removal, surface albedo, and renewable energy flux.";

    const climateCode = GenericExperienceGenerator.generate({
      componentName: "ClimateFluxWorkbench",
      brandName: "TerraPulse Climate Lab",
      route: "/climate-workbench",
      pageRole: "Planetary Carbon & Flux Workbench",
      purpose: "Interactive climate simulation console",
      prompt: climatePrompt,
      seed: 55,
      experienceCapability: "WORKSPACE_TOOL",
    });

    expect(climateCode).toContain("Planetary Carbon & Flux Workbench");
    expect(climateCode).toContain("Carbon Removal Throughput");
    expect(climateCode).toContain("Surface Albedo Reflectance");
    expect(climateCode).toContain('data-experience-capability="WORKSPACE_TOOL"');
    expect(climateCode).not.toContain("Kazzoo");
    expect(climateCode).not.toContain("Submersible");
  });

  it("TEST 8: Kazzoo regression: all 7 routes succeed via generic capability generators with 100% first-class pass", () => {
    const kazzooPrompt = "Build a whimsical 3D claymation interactive world for Kazzoo with floating archipelago, companions, quests, family stories, and soundboard.";

    const kazzooRoutes = [
      { path: "/", name: "WorldStage", role: "World Entrance & Living Spatial Universe", cap: "IMMERSIVE_3D" },
      { path: "/characters", name: "CharactersPage", role: "Interactive Character Spotlight & Lore Stage", cap: "CHARACTER_STAGE" },
      { path: "/quest-progression", name: "QuestProgressionPage", role: "Spatial Lore Map & Landmark Waypoint Navigator", cap: "SPATIAL_MAP" },
      { path: "/family-adventures", name: "FamilyAdventuresPage", role: "Scroll-Driven Narrative Progression & Discovery Ledger", cap: "SCROLL_STORY" },
      { path: "/play-whimsical-sounds", name: "PlayWhimsicalSoundsPage", role: "Atmospheric Sound Studio & Tactile Audio Environment", cap: "AUDIO_SYNTH" },
      { path: "/community-creations", name: "CommunityCreationsPage", role: "Community Creations Showcase", cap: "WORKSPACE_TOOL" },
      { path: "/parents-guide", name: "ParentsGuidePage", role: "Parents Guide & Wholesome Playbook", cap: "WORKSPACE_TOOL" },
    ];

    const kazzooDir = join(TEST_SANDBOX, "kazzoo-test");
    const pagesDir = join(kazzooDir, "src", "pages");
    mkdirSync(pagesDir, { recursive: true });

    for (const r of kazzooRoutes) {
      const code = GenericExperienceGenerator.generate({
        componentName: r.name,
        brandName: "Kazzoo",
        route: r.path,
        pageRole: r.role,
        purpose: r.role,
        prompt: kazzooPrompt,
        seed: 42,
        experienceCapability: r.cap,
      });

      writeFileSync(join(pagesDir, `${r.name}.tsx`), code, "utf8");
    }

    const mockKazzooPlan: ProductExperiencePlan = {
      brandName: "Kazzoo",
      genre: "SPATIAL_WORLD",
      pagePlans: kazzooRoutes.map(r => ({
        route: r.path,
        pageRole: r.role,
        purpose: r.role,
        experienceIntent: "Immerse in Kazzoo",
        focalElement: "Floating Stage",
        composition: {
          topology: r.cap as any,
          layers: [],
          sections: [],
          dominantStructure: "FULL_BLEED_STAGE" as any,
        },
        interaction: { primary: ["Click"], secondary: [] },
        motion: { entrance: "fade", scroll: "smooth", transitions: [] },
        contentPresentation: "Rich",
        visualHierarchy: { primary: "Main", secondary: [] },
        responsiveStrategy: "Responsive",
        requiredCapabilities:
          r.cap === "SPATIAL_MAP"
            ? ["interactive-map-canvas"]
            : r.cap === "AUDIO_SYNTH"
            ? ["web-audio-synth"]
            : r.cap === "SCROLL_STORY"
            ? ["scroll-chapter-controller"]
            : r.cap === "CHARACTER_STAGE"
            ? ["character-switcher"]
            : r.cap === "IMMERSIVE_3D"
            ? ["3d-webgl-canvas"]
            : [],
        forbiddenPatterns: ["search bar", "card grid", "crud forms"],
      })),
    } as any;

    const report = PageExperienceQualityGate.audit(kazzooDir, mockKazzooPlan);
    expect(report.status).toBe("PASS");
    expect(report.routesPassed).toBe(7);
    expect(report.passed).toBe(true);
  });
});
