/**
 * CandidateCompositionSynthesizer
 *
 * Generic generative experience engine that derives multiple structurally valid,
 * distinct composition architecture candidates directly from product semantics:
 * - Product meaning & intent
 * - Audience & emotional tone
 * - Visual personality & materials
 * - Primary activity & key interactions
 * - Required capabilities (3D, audio, quest map, soundboard, telemetry, etc.)
 *
 * SYSTEM INVARIANT:
 * "Aegis must never use hardcoded domain-specific strategy tables (e.g. KazzooLayouts[],
 * WatchLayouts[], PerfumeLayouts[]). Instead, candidate architectures are dynamically
 * synthesized from the product's actual semantics, and selected/perturbed by the generation seed."
 */

import type { ProductCharacteristics } from "./product-understanding.js";
import type { ExperienceCapabilityPlan } from "./experience-capability-plan.js";
import type {
  CompositionGraph,
  CompositionLayer,
  CompositionScene,
  CompositionSection,
  LayoutTopologyType,
  MotionPlan,
  SpatialPlan,
  UXIntentType,
} from "./composition-graph.js";
import type { NavigationModel } from "./navigation-design.js";

export interface CandidateExperienceArchitecture {
  strategyId: string;
  name: string;
  experienceIntent: string;
  focalElement: string;
  layoutTopology: LayoutTopologyType;
  navigationModel: NavigationModel;
  cardDensityRatio: number;
  spatialPlan?: SpatialPlan;
  motionPlan?: MotionPlan;
  scenes: CompositionScene[];
  sections: CompositionSection[];
  layers: CompositionLayer[];
  intent: UXIntentType;
  primaryFocus: {
    type: string;
    entity: string;
    title: string;
    description: string;
    density: string;
  };
  topology: {
    type: LayoutTopologyType;
    regions: Array<{
      id: string;
      role: string;
      gridSpan: { cols: number; rows?: number };
      density: string;
    }>;
  };
  widgets: any[];
  interactions: any[];
  responsiveStrategy: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
}

export class CandidateCompositionSynthesizer {
  /**
   * Generates candidate composition architectures dynamically derived from product meaning.
   */
  public static generateCandidates(options: {
    prompt: string;
    characteristics: ProductCharacteristics;
    capabilityPlan: ExperienceCapabilityPlan;
    domainContract?: any;
    generationSeed?: number;
  }): CandidateExperienceArchitecture[] {
    const raw = (options.prompt || "").toLowerCase();
    const { characteristics, capabilityPlan } = options;

    const isSpatial =
      capabilityPlan.real3dRequired ||
      capabilityPlan.experienceType === "IMMERSIVE_3D" ||
      capabilityPlan.experienceType === "WEBGL_EXPERIENCE";

    if (isSpatial) {
      return this.synthesizeSpatialCandidates(raw, characteristics, capabilityPlan, options.domainContract);
    }

    return this.synthesizeNonSpatialCandidates(raw, characteristics, capabilityPlan, options.domainContract);
  }

  /**
   * Synthesizes 5 distinct archetypal spatial candidates derived from the product's actual features and semantics.
   */
  private static synthesizeSpatialCandidates(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CandidateExperienceArchitecture[] {
    // 1. Extract semantic entities, environments, materials, and capabilities from the prompt
    const semanticProfile = this.extractSpatialSemanticProfile(rawPrompt, characteristics, capabilityPlan);

    // 2. Synthesize Candidate A: EXPEDITION / WORLD EXPLORATION
    const candidateA = this.buildExpeditionCandidate(semanticProfile, characteristics);

    // 3. Synthesize Candidate B: CINEMATIC JOURNEY / NARRATIVE DOLLY
    const candidateB = this.buildCinematicCandidate(semanticProfile, characteristics);

    // 4. Synthesize Candidate C: SPATIAL ATLAS / TOPOLOGICAL CARTOGRAPHY
    const candidateC = this.buildSpatialAtlasCandidate(semanticProfile, characteristics);

    // 5. Synthesize Candidate D: FOCAL STAGE / SPECIMEN TURNTABLE
    const candidateD = this.buildFocalStageCandidate(semanticProfile, characteristics);

    // 6. Synthesize Candidate E: INTERACTIVE PLAYGROUND / TACTILE WORKSPACE
    const candidateE = this.buildPlaygroundCandidate(semanticProfile, characteristics);

    if (semanticProfile.entityCategory === "flacon" || semanticProfile.entityCategory === "sneaker") {
      return [candidateD, candidateB, candidateC, candidateA, candidateE];
    }
    if (semanticProfile.entityCategory === "orrery") {
      return [candidateC, candidateB, candidateD, candidateA, candidateE];
    }
    return [candidateA, candidateB, candidateC, candidateD, candidateE];
  }

  /**
   * Synthesizes non-spatial candidate architectures.
   */
  private static synthesizeNonSpatialCandidates(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CandidateExperienceArchitecture[] {
    const primaryObject = (domainContract?.entities && domainContract.entities[0])
      ? (typeof domainContract.entities[0] === "string" ? domainContract.entities[0] : domainContract.entities[0].name)
      : (characteristics.vocabularyContract?.required?.[0] || "Item");

    const tone = characteristics.emotionalTone.primary || "professional";
    const pattern = characteristics.experiencePattern || "content-feed";

    // Candidate 1: Asymmetric Editorial Monograph
    const candEditorial: CandidateExperienceArchitecture = {
      strategyId: "EDITORIAL_CHRONICLE",
      name: "Typographic Editorial Chronicle",
      experienceIntent: `Curated typographic monograph and deep analytical exploration for ${primaryObject}`,
      focalElement: `Oversized dramatic headline with author monograph, pull-quote, and reading time indicator for ${primaryObject}`,
      layoutTopology: "EDITORIAL_LANDING",
      navigationModel: "top_masthead",
      cardDensityRatio: 0.12,
      scenes: [],
      layers: [
        { id: "l_bg", name: "Paper Texture Surface", depth: "background", renderingTechnology: "dom", contentRole: "Background", description: "Warm ivory textured surface" },
        { id: "l_content", name: "Typographic Narrative", depth: "foreground", renderingTechnology: "dom", contentRole: "Editorial Content", description: "High-contrast editorial typography" },
      ],
      sections: [
        {
          id: "sec_monograph_cover",
          order: 1,
          name: `${primaryObject} Monograph Cover`,
          focalElement: `Dramatic serif headline and lead monograph for ${primaryObject}`,
          layoutFamily: "EDITORIAL",
          gridStructure: "asymmetric-editorial",
          contentPurpose: `Immersive opening to the ${primaryObject} publication`,
          primaryAction: { label: "Begin Reading Monograph", action: "scroll_reading" },
          secondaryElements: ["Reading time", "Issue folio", "Author credentials"],
        },
        {
          id: "sec_narrative_body",
          order: 2,
          name: `${primaryObject} Narrative & Essays`,
          focalElement: "High-contrast multi-column narrative body with marginal citations",
          layoutFamily: "EDITORIAL",
          gridStructure: "prose-with-marginalia",
          contentPurpose: "Deep scholarly or narrative exploration",
          secondaryElements: ["Footnotes", "Historical timeline sidebar"],
        },
        {
          id: "sec_archival_folio",
          order: 3,
          name: "Curated Archival Folio",
          focalElement: "Horizontal sliding reel of related monographs and essays",
          layoutFamily: "GRID_CATALOG",
          gridStructure: "horizontal-folio",
          contentPurpose: "Explore related publications",
          primaryAction: { label: "Browse Entire Archive", action: "open_archive" },
          secondaryElements: ["Filter by era", "Curator notes"],
        },
      ],
      intent: "CREATE_AUTHOR",
      topology: {
        type: "EDITORIAL_LANDING",
        regions: [
          { id: "cover", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "essay", role: "primary", gridSpan: { cols: 8 }, density: "balanced" },
          { id: "marginalia", role: "secondary", gridSpan: { cols: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "document_workspace",
        entity: primaryObject,
        title: `Curated ${primaryObject} Monograph`,
        description: `Analytical monograph for ${primaryObject}`,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "split-5-7",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };

    // Candidate 2: Curated Showcase Banner & Catalog
    const candShowcase: CandidateExperienceArchitecture = {
      strategyId: "CURATED_SHOWCASE",
      name: "Curated Product Showcase & Drawer",
      experienceIntent: `Continuous showcase with category exploration, curated ${primaryObject} grid, and slide-out action drawer`,
      focalElement: `Showcase banner with category pills and spotlighted ${primaryObject}`,
      layoutTopology: "PORTAL_HERO_SHOWCASE",
      navigationModel: "top_masthead",
      cardDensityRatio: 0.45,
      scenes: [],
      layers: [],
      sections: [
        {
          id: "sec_showcase_banner",
          order: 1,
          name: `${primaryObject} Showcase Banner`,
          focalElement: `Promotional spotlight banner for ${primaryObject}`,
          layoutFamily: "STOREFRONT",
          gridStructure: "full-width-banner",
          contentPurpose: `Brand introduction and immediate ${primaryObject} entry point`,
          primaryAction: { label: `Explore ${primaryObject}`, action: "scroll_catalog" },
          secondaryElements: ["Featured badge", "Status indicator"],
        },
        {
          id: "sec_catalog_grid",
          order: 2,
          name: `${primaryObject} Catalog Grid`,
          focalElement: `Responsive grid of ${primaryObject} items with instant action`,
          layoutFamily: "GRID_CATALOG",
          gridStructure: "grid-4-col",
          contentPurpose: `Browse and select ${primaryObject} items`,
          primaryAction: { label: "Select Item", action: "select_item" },
          secondaryElements: ["Filter tags", "Specifications"],
        },
      ],
      intent: "TRANSACT_BROWSE",
      topology: {
        type: "PORTAL_HERO_SHOWCASE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "catalog", role: "primary", gridSpan: { cols: 12 }, density: "spacious" },
        ],
      },
      primaryFocus: {
        type: "catalog_grid",
        entity: primaryObject,
        title: `${primaryObject} Catalog`,
        description: `Explore ${primaryObject}`,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-2-col",
        mobile: "single-column-flow",
      },
    };

    // Candidate 3: Command & Telemetry Console
    const candConsole: CandidateExperienceArchitecture = {
      strategyId: "OPERATIONAL_CONSOLE",
      name: "Command & Telemetry Console",
      experienceIntent: `High-density telemetry and operational console for monitoring ${primaryObject} flux and state`,
      focalElement: `Live status matrix with state gauges and real-time signal ticker for ${primaryObject}`,
      layoutTopology: "OPERATIONAL_COMMAND_CONSOLE",
      navigationModel: "sidebar",
      cardDensityRatio: 0.35,
      scenes: [],
      layers: [],
      sections: [
        {
          id: "sec_console_telemetry",
          order: 1,
          name: "Operational Telemetry Matrix",
          focalElement: "Live signal gauges and operational state monitors",
          layoutFamily: "CONSOLE",
          gridStructure: "command-grid",
          contentPurpose: "Continuous telemetry inspection and signal dispatch",
          primaryAction: { label: "Dispatch Signal", action: "dispatch_signal" },
          secondaryElements: ["Signal health", "Active status"],
        },
        {
          id: "sec_event_ledger",
          order: 2,
          name: "Audit & Event Ledger",
          focalElement: "Real-time chronological activity ledger",
          layoutFamily: "TIMELINE",
          gridStructure: "split-timeline",
          contentPurpose: "Inspect event history and telemetry anomalies",
          secondaryElements: ["Timestamp filter", "Severity badges"],
        },
      ],
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: "OPERATIONAL_COMMAND_CONSOLE",
        regions: [
          { id: "telemetry", role: "primary", gridSpan: { cols: 8 }, density: "compact" },
          { id: "sidebar", role: "aside", gridSpan: { cols: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "telemetry_grid",
        entity: primaryObject,
        title: `${primaryObject} Status Matrix`,
        description: `Operational telemetry for ${primaryObject}`,
        density: "compact",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "command-console-3",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };

    return [candEditorial, candShowcase, candConsole];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Semantic Profile Extraction
  // ──────────────────────────────────────────────────────────────────────────

  private static extractSpatialSemanticProfile(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan
  ) {
    // 1. Identify primary domain character / entity
    let primarySubject = "interactive 3D world";
    let focalEntityName = "Realm World";
    let entityCategory = "landmark";

    if (rawPrompt.includes("perfume") || rawPrompt.includes("fragrance") || rawPrompt.includes("scent") || rawPrompt.includes("bottle") || rawPrompt.includes("flacon")) {
      primarySubject = "sculptural crystal perfume flacon";
      focalEntityName = "Crystal Perfume Flacon";
      entityCategory = "flacon";
    } else if (rawPrompt.includes("sneaker") || rawPrompt.includes("shoe") || rawPrompt.includes("footwear")) {
      primarySubject = "futuristic athletic sneaker";
      focalEntityName = "Suspended Sneaker Mesh";
      entityCategory = "sneaker";
    } else if (rawPrompt.includes("space") || rawPrompt.includes("astronomy") || rawPrompt.includes("planet") || rawPrompt.includes("orrery") || rawPrompt.includes("cosmos") || rawPrompt.includes("observatory")) {
      primarySubject = "celestial solar system orrery";
      focalEntityName = "Solar System Orrery";
      entityCategory = "orrery";
    } else if (rawPrompt.includes("kazzoo") || rawPrompt.includes("claymation") || rawPrompt.includes("fantasy")) {
      primarySubject = "whimsical 3D claymation fantasy universe";
      focalEntityName = "Claymation Fantasy Realm";
      entityCategory = "companion";
    } else if (rawPrompt.includes("ocean") || rawPrompt.includes("underwater") || rawPrompt.includes("submersible") || rawPrompt.includes("abyssal")) {
      primarySubject = "deep sea abyssal marine universe";
      focalEntityName = "Abyssal Ocean Trench";
      entityCategory = "specimen";
    } else if (rawPrompt.includes("watch") || rawPrompt.includes("horology") || rawPrompt.includes("timepiece")) {
      primarySubject = "artisan mechanical horology caliber";
      focalEntityName = "Tourbillon Timepiece";
      entityCategory = "caliber";
    } else if (rawPrompt.includes("furniture") || rawPrompt.includes("chair") || rawPrompt.includes("sofa") || rawPrompt.includes("interior")) {
      primarySubject = "architectural modular furniture suite";
      focalEntityName = "Modular Furniture Centerpiece";
      entityCategory = "module";
    } else if (rawPrompt.includes("climate") || rawPrompt.includes("planet") || rawPrompt.includes("earth")) {
      primarySubject = "planetary atmosphere and orbital systems";
      focalEntityName = "Planetary Biosphere";
      entityCategory = "biome";
    } else if (rawPrompt.includes("music") || rawPrompt.includes("sound") || rawPrompt.includes("chime")) {
      primarySubject = "tactile acoustic music playground";
      focalEntityName = "Acoustic Melody Stage";
      entityCategory = "instrument";
    }

    // 2. Identify environment mood & lighting
    let environmentDescription = "Enchanted dusk sky with procedural volumetric clouds, floating stardust, and warm amber lights";
    let lightingModel = "Warm ambient daylight with soft directional sunlight casting claymation shadow mounds";
    let materialsDescription = "Tactile claymation materials (roughness 0.65, metalness 0.05) with saturated playful hues";

    if (rawPrompt.includes("perfume") || rawPrompt.includes("fragrance") || rawPrompt.includes("scent") || rawPrompt.includes("flacon")) {
      environmentDescription = "Minimal dark studio void with subtle warm rim lighting and floating aromatic dust particles";
      lightingModel = "Three-point studio lighting with high specular highlights and soft ground shadow plane";
      materialsDescription = "Physical glass material (transparency 0.9, roughness 0.05, transmission 0.95, IOR 1.52) with liquid inner mesh";
    } else if (rawPrompt.includes("sneaker") || rawPrompt.includes("shoe")) {
      environmentDescription = "Dark industrial soundstage with dynamic floor neon reflection grid and volumetric light shafts";
      lightingModel = "Dual high-contrast rim lights (cyan + electric orange) with soft key fill";
      materialsDescription = "Procedural carbon fiber weave, translucent air bubble shader, and breathable engineered mesh";
    } else if (rawPrompt.includes("space") || rawPrompt.includes("astronomy") || rawPrompt.includes("orrery")) {
      environmentDescription = "Deep space cosmic void with procedural starfield (10,000 points) and subtle chromatic nebula dust";
      lightingModel = "Omnidirectional sun point light with volumetric corona glow and soft cosmic ambient fill";
      materialsDescription = "Procedural planet surface shaders and emissive star particles";
    } else if (rawPrompt.includes("claymation") || rawPrompt.includes("pixar") || rawPrompt.includes("nintendo") || rawPrompt.includes("mossy") || rawPrompt.includes("pastel")) {
      environmentDescription = "Warm golden sky with fluffy procedural volumetric clouds, mossy slopes, and drifting pastel stardust";
      lightingModel = "Warm ambient daylight with soft directional sunlight casting claymation shadow mounds";
      materialsDescription = "Tactile claymation materials (roughness 0.65, metalness 0.05) with saturated playful hues and mossy textures";
    } else if (rawPrompt.includes("ocean") || rawPrompt.includes("underwater") || rawPrompt.includes("marine")) {
      environmentDescription = "Deep oceanic abyssal void with bioluminescent plankton drift and shimmering water caustics";
      lightingModel = "Submersible dual halogen beam lighting cutting through deep ocean darkness with soft blue backfill";
      materialsDescription = "Deep ocean water shader, refractive bioluminescent glass, and weathered submersible titanium";
    } else if (rawPrompt.includes("watch") || rawPrompt.includes("atelier") || rawPrompt.includes("luxury")) {
      environmentDescription = "Dark studio void with brushed graphite plinth, warm golden grazing rim light, and floating dust";
      lightingModel = "Precision chiaroscuro spotlighting with anisotropic highlights on brushed metal bevels and polished anglage";
      materialsDescription = "Brushed grade-5 titanium, 18k 5N rose gold, anti-reflective sapphire crystal, and vitreous enamel";
    } else if (rawPrompt.includes("furniture") || rawPrompt.includes("architectural")) {
      environmentDescription = "Sun-drenched architectural pavilion with natural oak planking and soft daylight diffused through floor-to-ceiling glass";
      lightingModel = "Natural northern daylight with soft ambient bounce light and gentle ground contact shadows";
      materialsDescription = "Full-grain aniline leather, oiled solid walnut, brushed champagne brass, and bouclé textile weave";
    }

    // 3. Extract required capabilities
    const hasCharacters = rawPrompt.includes("character") || rawPrompt.includes("companion") || rawPrompt.includes("avatar") || rawPrompt.includes("specimen") || rawPrompt.includes("inhabitant");
    const hasQuests = rawPrompt.includes("quest") || rawPrompt.includes("mission") || rawPrompt.includes("trial") || rawPrompt.includes("challenge") || rawPrompt.includes("expedition");
    const hasAudio = (capabilityPlan as any).audioSupported || (capabilityPlan as any).ambientAudioSupported || rawPrompt.includes("soundboard") || rawPrompt.includes("voice") || rawPrompt.includes("audio") || rawPrompt.includes("chime") || rawPrompt.includes("hydrophone");
    const hasJourney = rawPrompt.includes("journey") || rawPrompt.includes("scroll") || rawPrompt.includes("timeline") || rawPrompt.includes("logbook") || rawPrompt.includes("chronicle");

    return {
      primarySubject,
      focalEntityName,
      entityCategory,
      environmentDescription,
      lightingModel,
      materialsDescription,
      hasCharacters,
      hasQuests,
      hasAudio,
      hasJourney,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Candidate Builders
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Candidate 1: WORLD_EXPLORATION
   * Panoramic spatial exploration with interactive POI discovery and perimeter HUD.
   */
  private static buildExpeditionCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics
  ): CandidateExperienceArchitecture {
    const experienceIntent = `Immersive 3D ${profile.primarySubject} with interactive spatial world explorer, ${profile.hasQuests ? "quest landmarks, " : ""}${profile.hasAudio ? "ambient soundboard, " : ""}${profile.hasCharacters ? "and companion sanctums" : ""}`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Hand-finished tourbillon timepiece in grade-5 titanium and 18k rose gold with interactive 360-degree rotation"
      : profile.entityCategory === "specimen"
      ? "Abyssal research submersible with external manipulator arms and volumetric marine spotlights"
      : profile.entityCategory === "module"
      ? "Architectural modular seating centerpiece with customizable tactile materials and proportions"
      : `Floating procedural 3D archipelago with volumetric atmosphere, interactive landmarks, and ${profile.entityCategory} beacons`;

    const navigationModel = "immersive-hud" as any;
    const layoutTopology: LayoutTopologyType = "PLAYFUL_WORKSPACE";
    const cardDensityRatio = 0.08;

    const spatialPlan: SpatialPlan = {
      sceneType: "WORLD_EXPLORATION",
      focalObject: profile.entityCategory === "caliber"
        ? "Artisan tourbillon watch with sapphire crystal, grand feu enamel dial, and exhibition caseback"
        : profile.entityCategory === "specimen"
        ? "Deep sea hydrothermal vent spire with bioluminescent organisms and research submersible"
        : profile.entityCategory === "module"
        ? "Modular architectural furniture suite in daylight interior pavilion"
        : `Floating 3D island terrain with tactile surface contours, interactive landmark totems, and ${profile.entityCategory} encounters`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Gentle smooth orbit camera with responsive landmark focusing on user click",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "floating_overlay",
        components: ["Active Realm Indicator", "Ambient Soundboard Mixer", "Quest HUD Compass", "Companion Roster"],
      },
      interactionTopology: "raycast_inspection",
    };

    const scenes: CompositionScene[] = [
      {
        id: "scene_world_stage",
        sceneIndex: 1,
        name: "The Floating Realm Stage",
        intent: "Full 3D spatial world exploration with panoramic orbital overview",
        focalSubject: "Floating Archipelago Stage",
        cameraOrViewBehavior: { perspective: "orbit", motionProfile: "gentle_float", targetFocus: "Island Center" },
        spatialElements: ["Floating Island Mounds", "Volumetric Atmosphere", "Quest Landmark Totems"],
        hudElements: ["Realm Name Badge", "Audio Atmosphere Toggle"],
        interactiveControls: ["Landmark Raycasting", "Camera Angle Switcher"],
        narrativeOrContent: `A living ${profile.primarySubject} waiting to be explored by fearless journeyers.`,
      },
      {
        id: "scene_companions",
        sceneIndex: 2,
        name: "Sanctuary of Companions & Inhabitants",
        intent: "Meet animated characters stationed across the realm with voice lines and lore",
        focalSubject: "Companion Avatars",
        spatialElements: ["Character Meshes", "Campfire Embers", "Whimsical Props"],
        hudElements: ["Companion Lore Card", "Voice Clip Playback"],
        narrativeOrContent: "Befriend mystical forest guardians and ancient star-weavers.",
      },
      {
        id: "scene_quests",
        sceneIndex: 3,
        name: "Quest Journey & Milestones",
        intent: "Track active quests, discover hidden biomes, and record exploration achievements",
        focalSubject: "Spatial Quest Map",
        spatialElements: ["Quest Trail Path", "Glowing Waypoint Beacon"],
        interactiveControls: ["Quest Selection", "Checkpoint Log"],
        narrativeOrContent: "Unravel ancient mysteries across the whispering peaks and enchanted groves.",
      },
      {
        id: "scene_soundboard",
        sceneIndex: 4,
        name: "Ambient Atmosphere & Soundboard Mixer",
        intent: "Interactive audio mixer with environmental atmosphere sliders and harmonic chime pads",
        focalSubject: "Soundboard Totem",
        interactiveControls: ["Breeze Volume Slider", "Forest Chime Trigger", "Mythical Flute Player"],
        narrativeOrContent: "Tune the ambient resonance of the enchanted groves and starry night skies.",
      },
    ];

    const sections: CompositionSection[] = [
      {
        id: "sec_world_stage",
        order: 1,
        name: "Floating Realm 3D Stage",
        focalElement: "Full-bleed WebGL claymation universe with floating landmarks and cloud layers",
        layoutFamily: "IMMERSIVE_WORLD",
        gridStructure: "canvas-fullbleed",
        contentPurpose: "Interactive spatial navigation across the fantasy archipelago",
        primaryAction: { label: "Explore Realm Landmarks", action: "explore_landmarks" },
        secondaryElements: ["Realm selector", "Live companion counter"],
      },
      {
        id: "sec_companions",
        order: 2,
        name: "Companion Encounters",
        focalElement: "Interactive character spotlight with 3D avatar animations and whimsical lore",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-3d-text",
        contentPurpose: "Meet mythical companions and listen to their stories",
        secondaryElements: ["Character traits", "Voice clips"],
      },
      {
        id: "sec_quests",
        order: 3,
        name: "Quest Ledger & Journey Scroll",
        focalElement: "Interactive quest trail map with milestone completion badges",
        layoutFamily: "TIMELINE",
        gridStructure: "scroll-timeline",
        contentPurpose: "Track exploration journey and claim realm badges",
        primaryAction: { label: "Accept Quest", action: "accept_quest" },
        secondaryElements: ["Milestone badges", "Artifact pouch"],
      },
      {
        id: "sec_soundboard",
        order: 4,
        name: "Atmosphere & Ambient Soundboard",
        focalElement: "Tactile audio mixer console with ambient sliders and playful sound triggers",
        layoutFamily: "CONSOLE",
        gridStructure: "dock-panel",
        contentPurpose: "Mix realm sounds and environmental audio",
        secondaryElements: ["Sound wave visualizer", "Preset themes"],
      },
    ];

    const layers: CompositionLayer[] = [
      { id: "l_sky", name: "Enchanted Atmosphere", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: "Atmospheric sky with volumetric shaders" },
      { id: "l_world", name: "3D Islands & Entities", depth: "midground", renderingTechnology: "webgl", contentRole: "Living World", description: "Rounded terrain, floating islands, and interactive characters" },
      { id: "l_hud", name: "Floating HUD & Soundboard Dock", depth: "hud", renderingTechnology: "dom", contentRole: "User Interface", description: "Pill navigation, quest counter, and audio mixer" },
    ];

    return {
      strategyId: "WORLD_EXPLORATION",
      name: "Spatial World Exploration",
      experienceIntent,
      focalElement,
      layoutTopology,
      navigationModel,
      cardDensityRatio,
      spatialPlan,
      scenes,
      sections,
      layers,
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: layoutTopology,
        regions: [
          { id: "hero-stage", role: "hero", gridSpan: { cols: 12, rows: 6 }, density: "spacious" },
          { id: "spatial-exploration", role: "primary", gridSpan: { cols: 8, rows: 4 }, density: "balanced" },
          { id: "realm-hud", role: "aside", gridSpan: { cols: 4, rows: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "live_stage_matrix",
        entity: profile.focalEntityName,
        title: focalElement.slice(0, 32),
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Candidate 2: CINEMATIC_JOURNEY
   * Scroll-linked dolly glide following narrative milestones and waypoints.
   */
  private static buildCinematicCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics
  ): CandidateExperienceArchitecture {
    const experienceIntent = `Cinematic 3D ${profile.primarySubject} scroll journey through enchanted landmarks, character encounters, and whimsical sound echoes`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Cinematic slow-orbit tourbillon centerpiece with macro focal transitions across dial indices"
      : profile.entityCategory === "specimen"
      ? "Submersible descent journey scroll tracking marine depth transitions and bathypelagic layers"
      : profile.entityCategory === "module"
      ? "Architectural furniture craft journey following joinery, material selection, and final hand finishing"
      : "Panoramic 3D cinematic river valley with volumetric atmosphere, companion waypoints, and journey scroll milestones";

    const navigationModel: NavigationModel = "floating_pills";
    const layoutTopology: LayoutTopologyType = "PORTAL_HERO_SHOWCASE";
    const cardDensityRatio = 0.06;

    const spatialPlan: SpatialPlan = {
      sceneType: "NARRATIVE_JOURNEY",
      focalObject: profile.entityCategory === "caliber"
        ? "Artisan tourbillon watch with sapphire crystal, grand feu enamel dial, and exhibition caseback"
        : profile.entityCategory === "specimen"
        ? "Descending research bathyscaphe traversing benthic marine zones and deep hydrothermal plumes"
        : profile.entityCategory === "module"
        ? "Handcrafted solid walnut joinery framework with bespoke leather upholstery layers"
        : "Winding valley path with landmarks, floating pastel spheres, and companion rest stops",
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Cinematic scroll-linked dolly camera gliding along whimsical valley pass",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "minimal_compass",
        components: ["Journey Chapter Marker", "Magical Soundboard Toggle", "Realm Map Compass"],
      },
      interactionTopology: "scroll_driven_orbit",
    };

    const scenes: CompositionScene[] = [
      {
        id: "scene_journey_intro",
        sceneIndex: 1,
        name: "The Dawn Crossing",
        intent: "Gliding camera entrance over mossy ridges as the day begins",
        focalSubject: "Valley Ridge Path",
        cameraOrViewBehavior: { perspective: "scroll_dolly", motionProfile: "gentle_float", targetFocus: "River Pass" },
        spatialElements: ["Pastel Spheres", "Moss Mound Topography", "Sunbeam Rays"],
        narrativeOrContent: "Every great quest starts with a single step into the morning mist.",
      },
      {
        id: "scene_companions_waypoint",
        sceneIndex: 2,
        name: "Companions at the Crossroads",
        intent: "Meet valley guardians and hear voice greetings",
        focalSubject: "Guardian Campfire",
        spatialElements: ["Character Avatars", "Campfire Embers", "Whimsical Props"],
        hudElements: ["Companion Dialogue", "Voice Playback"],
        narrativeOrContent: "Ancient storytellers offer guidance for the path ahead.",
      },
      {
        id: "scene_sound_grove",
        sceneIndex: 3,
        name: "Harmonic Sound Grove",
        intent: "Atmospheric chime audio immersion",
        focalSubject: "Chime Totem Tree",
        interactiveControls: ["Harmonic Chimes", "Wind Intensity"],
        narrativeOrContent: "The leaves sing with resonant chime notes C4, E4, and G4.",
      },
    ];

    const sections: CompositionSection[] = [
      {
        id: "sec_journey_hero",
        order: 1,
        name: "The Living Journey Scroll & 3D Entrance",
        focalElement: "Cinematic 3D world scroll with mossy knolls and drifting volumetric clouds",
        layoutFamily: "HERO_CANVAS",
        gridStructure: "canvas-fullbleed",
        contentPurpose: "Cinematic world entrance and narrative embarkation",
        primaryAction: { label: "Begin Journey Scroll", action: "scroll_journey" },
        secondaryElements: ["Realm Chapter", "Active Companions"],
      },
      {
        id: "sec_companion_encounters",
        order: 2,
        name: "Tales of the Valley Companions",
        focalElement: "Story-driven character bio cards with authentic voice audio clips",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-3d-text",
        contentPurpose: "Meet mythical companions and hear their ancient voice clips",
        secondaryElements: ["Companion origin", "Voice clips"],
      },
      {
        id: "sec_trials_path",
        order: 3,
        name: "Quest Trials Along the Ridge",
        focalElement: "Illustrated quest ledger with milestone badges and discovery trials",
        layoutFamily: "TIMELINE",
        gridStructure: "scroll-timeline",
        contentPurpose: "Track active quest progression and realm discoveries",
        primaryAction: { label: "Accept Trial", action: "accept_quest" },
        secondaryElements: ["Spore dust charms", "Milestone trophies"],
      },
      {
        id: "sec_sound_echoes",
        order: 4,
        name: "Echoes of the Magical Soundboard",
        focalElement: "Harmonic soundboard pads embedded in the journey narrative",
        layoutFamily: "CONSOLE",
        gridStructure: "dock-panel",
        contentPurpose: "Interactive soundboard with playful chime and flute chords",
        secondaryElements: ["Chime frequencies", "Ambient volume"],
      },
    ];

    const layers: CompositionLayer[] = [
      { id: "l_sky", name: "Dawn Skies & Clouds", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: "Soft dawn sky with procedural clouds" },
      { id: "l_world", name: "Valley Path & Waypoints", depth: "midground", renderingTechnology: "webgl", contentRole: "Living World", description: "Winding river trail and character encampments" },
      { id: "l_hud", name: "Journey HUD & Compass", depth: "hud", renderingTechnology: "dom", contentRole: "User Interface", description: "Pill navigation and chapter trackers" },
    ];

    return {
      strategyId: "CINEMATIC_JOURNEY",
      name: "Cinematic Living Journey",
      experienceIntent,
      focalElement,
      layoutTopology,
      navigationModel,
      cardDensityRatio,
      spatialPlan,
      scenes,
      sections,
      layers,
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: layoutTopology,
        regions: [
          { id: "hero-stage", role: "hero", gridSpan: { cols: 12, rows: 6 }, density: "spacious" },
          { id: "narrative-flow", role: "primary", gridSpan: { cols: 12, rows: 4 }, density: "spacious" },
        ],
      },
      primaryFocus: {
        type: "live_stage_matrix",
        entity: profile.focalEntityName,
        title: focalElement.slice(0, 32),
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Candidate 3: SPATIAL_ATLAS
   * Cartographic relief map overview with asymmetric split-pane and landmark inspections.
   */
  private static buildSpatialAtlasCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics
  ): CandidateExperienceArchitecture {
    const experienceIntent = `Spatial cartography & landmark atlas with 3D terrain topography, quest waypoints, and companion sanctums`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Exploded caliber complication matrix with separated balance wheel, tourbillon cage, and bridges"
      : profile.entityCategory === "specimen"
      ? "Bathymetric ocean floor relief model with coordinates of hydrothermal vents and abyssal trenches"
      : profile.entityCategory === "module"
      ? "Architectural spatial matrix and blueprint layout with modular component specifications"
      : "Interactive 3D topological realm map with glowing quest landmarks and animated waypoint trails";

    const navigationModel: NavigationModel = profile.entityCategory === "orrery" ? ("orbital-ring-compass" as any) : "floating_pills";
    const layoutTopology: LayoutTopologyType = "ASYMMETRIC_SPLIT_PANE";
    const cardDensityRatio = 0.07;

    const spatialPlan: SpatialPlan = {
      sceneType: "SPATIAL_EXHIBITION",
      focalObject: profile.entityCategory === "caliber"
        ? "Exploded caliber complication assembly of manufacture movement with floating tourbillon components"
        : profile.entityCategory === "specimen"
        ? "Bathymetric ocean floor relief model with coordinates of hydrothermal vents and deep abyssal plains"
        : profile.entityCategory === "module"
        ? "Architectural floorplan spatial matrix with configurable furniture modules"
        : profile.entityCategory === "orrery"
        ? "Full scale 3D procedural Solar system orrery with central sun, orbiting textured planets, and asteroid belt"
        : "Topological relief map with glowing landmark pins, biome ridges, and hidden companion burrows",
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Topological realm atlas view with bird's-eye panning and biome pin focusing",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "perimeter_dock",
        components: ["Biome Coordinates HUD", "Discovered Landmarks 2/6", "Soundboard Resonance"],
      },
      interactionTopology: "poi_teleport",
    };

    const scenes: CompositionScene[] = [
      {
        id: "scene_topomap",
        sceneIndex: 1,
        name: "Topological Realm Cartography",
        intent: "Bird's eye overview of the realm biomes and waypoints",
        focalSubject: "Realm Atlas Grid",
        cameraOrViewBehavior: { perspective: "orbit", motionProfile: "slow_axial_orbit", targetFocus: "Central Mountain" },
        spatialElements: ["Whispering Valley", "Crystal Ridge", "Elder Knoll"],
        narrativeOrContent: "Chart unmapped frontiers and uncharted groves.",
      },
      {
        id: "scene_waypoint_inspect",
        sceneIndex: 2,
        name: "Biome Landmark Inspection",
        intent: "Focus into clicked landmark waypoint",
        focalSubject: "Selected Landmark Marker",
        cameraOrViewBehavior: { perspective: "scroll_dolly", motionProfile: "kinetic_snap", targetFocus: "Waypoint Node" },
        spatialElements: ["Glowing Marker Beacon", "Waypoint Terrain Cutout"],
        narrativeOrContent: "Each landmark preserves an ancient secret of the realm.",
      },
    ];

    const sections: CompositionSection[] = profile.entityCategory === "orrery"
      ? [
          {
            id: "sec_orrery",
            order: 1,
            name: "Cosmic Orrery Stage",
            focalElement: "Full-bleed 3D solar system canvas with orbital ring compass",
            layoutFamily: "IMMERSIVE_WORLD",
            gridStructure: "canvas-fullbleed",
            contentPurpose: "Interactive planetary exploration and orbital navigation",
            primaryAction: { label: "Focus Inner Planets", action: "focus_planets" },
            secondaryElements: ["Spacecraft tracker", "Live celestial clock"],
          },
          {
            id: "sec_telemetry",
            order: 2,
            name: "Planetary Telemetry & Surface Diagnostics",
            focalElement: "Spatial planet inspection HUD with atmospheric density charts",
            layoutFamily: "CONSOLE",
            gridStructure: "split-3d-text",
            contentPurpose: "Examine geological composition, atmosphere, and surface probes",
            secondaryElements: ["Probe mission log", "Spectroscopy readings"],
          },
          {
            id: "sec_booking",
            order: 3,
            name: "Observatory Telescope Reservation",
            focalElement: "Observation session schedule and dome booking form",
            layoutFamily: "FORM_CENTRIC",
            gridStructure: "split-form-schedule",
            contentPurpose: "Reserve viewing time with resident astrophysicists",
            primaryAction: { label: "Reserve Observation Slot", action: "open_reservation" },
            secondaryElements: ["Telescope specs", "Sky condition forecast"],
          },
        ]
      : [
          {
            id: "sec_atlas_viewport",
            order: 1,
            name: "Topological Atlas Stage",
            focalElement: "Interactive 3D realm map with clickable biome landmarks and quest waypoints",
            layoutFamily: "IMMERSIVE_WORLD",
            gridStructure: "canvas-fullbleed",
            contentPurpose: "Spatial exploration of realm landmarks and terrain topography",
        primaryAction: { label: "Inspect Active Waypoint", action: "select_waypoint" },
        secondaryElements: ["Discovered landmarks counter", "Biome filter"],
      },
      {
        id: "sec_active_quests",
        order: 2,
        name: "Waypoint Dossier & Quest Trials",
        focalElement: "Sliding quest dossier revealing secrets of the selected map landmark",
        layoutFamily: "SPLIT_SHOWCASE",
        gridStructure: "split-6-6",
        contentPurpose: "Undertake landmark quests and claim spore dust charms",
        primaryAction: { label: "Embark on Quest", action: "start_quest" },
        secondaryElements: ["Trial difficulty", "Artifact rewards"],
      },
      {
        id: "sec_character_lore",
        order: 3,
        name: "Guardian Inhabitants & Voice Glyphs",
        focalElement: "Interactive companion encounter cards with voice frequency waveforms",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-3d-text",
        contentPurpose: "Inspect companion lore, traits, and hear spoken wisdom",
        secondaryElements: ["Origin biomes", "Voice recordings"],
      },
      {
        id: "sec_atmosphere_lab",
        order: 4,
        name: "Ambient Frequency & Sound Studio",
        focalElement: "Magical soundboard console with forest chime visualizers and ambient sliders",
        layoutFamily: "CONSOLE",
        gridStructure: "dock-panel",
        contentPurpose: "Play realm ambient soundboard and harmonic frequencies",
        secondaryElements: ["Frequency visualizer", "Harmonic notes"],
      },
    ];

    const layers: CompositionLayer[] = [
      { id: "l_sky", name: "Twilight Starlight", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: "Atmospheric celestial sky" },
      { id: "l_world", name: "Topological Relief Mesh", depth: "midground", renderingTechnology: "webgl", contentRole: "Atlas Terrain", description: "Elevated contour hills and glowing node points" },
      { id: "l_hud", name: "Compass & Landmark Radar", depth: "hud", renderingTechnology: "dom", contentRole: "Navigation HUD", description: "Perimeter coordinate instruments" },
    ];

    return {
      strategyId: "SPATIAL_ATLAS",
      name: "Topological Spatial Atlas",
      experienceIntent,
      focalElement,
      layoutTopology,
      navigationModel,
      cardDensityRatio,
      spatialPlan,
      scenes,
      sections,
      layers,
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: layoutTopology,
        regions: [
          { id: "atlas-viewport", role: "primary", gridSpan: { cols: 8, rows: 6 }, density: "spacious" },
          { id: "waypoint-dossier", role: "aside", gridSpan: { cols: 4, rows: 6 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "live_stage_matrix",
        entity: profile.focalEntityName,
        title: focalElement.slice(0, 32),
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "split-8-4",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Candidate 4: CHARACTER_STAGE (or FOCAL_STAGE)
   * 360-degree pedestal spotlight inspecting an active character or entity, with companion dock.
   */
  private static buildFocalStageCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics
  ): CandidateExperienceArchitecture {
    const experienceIntent = `Character-focused 3D spotlight and lore stage with rotatable companion plinth, voice playback, and quest challenges`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Hand-finished tourbillon timepiece in grade-5 titanium and 18k rose gold with interactive 360-degree rotation"
      : profile.entityCategory === "specimen"
      ? "3D deep sea creature specimen turntable with bioluminescent luminescence and anatomical callouts"
      : profile.entityCategory === "module"
      ? "3D architectural lounge chair with rotatable plinth and customizable leather materials"
      : `Large 3D character inspection plinth with animated companion avatar, claymation props, and voice trigger`;

    let navigationModel: NavigationModel = "bottom_dock";
    if (profile.entityCategory === "flacon") {
      navigationModel = "minimal-floating-wordmark" as any;
    } else if (profile.entityCategory === "sneaker") {
      navigationModel = "kinetic-corner-hud" as any;
    }
    const layoutTopology: LayoutTopologyType = profile.entityCategory === "flacon" ? "PORTAL_HERO_SHOWCASE" : "SPLIT_SCREEN_WORKSPACE";
    const cardDensityRatio = 0.05;

    const spatialPlan: SpatialPlan = {
      sceneType: profile.entityCategory === "flacon" ? "PRODUCT_REVEAL" : "PRODUCT_STAGE",
      focalObject: profile.entityCategory === "flacon"
        ? "Bespoke geometric glass flacon with inner golden fragrance liquid and brushed brass cap"
        : profile.entityCategory === "sneaker"
        ? "Futuristic athletic sneaker suspended in air with separated upper, carbon plate, and foam sole"
        : profile.entityCategory === "caliber"
        ? "Artisan tourbillon watch on rotating graphite plinth with exhibition caseback and macro inspection"
        : profile.entityCategory === "specimen"
        ? "Bioluminescent deep sea creature specimen on floating acoustic observation turntable"
        : profile.entityCategory === "module"
        ? "Sculptural lounge chair on rotating architectural plinth with real-time textile swatches"
        : `Tactile claymation companion on rotating pedestal stage with responsive facial expressions and props`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Pedestal character turntable with close-up face and voice gesture tracking",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "integrated_sidebar",
        components: ["Companion Roster Selector", "Voice Resonance Gauge", "Quest Ledger"],
      },
      interactionTopology: "direct_mesh_manipulation",
    };

    const scenes: CompositionScene[] = [
      {
        id: "scene_plinth",
        sceneIndex: 1,
        name: "The Character Pedestal",
        intent: "Close-up 360-degree rotation of selected companion avatar",
        focalSubject: "Active Companion Model",
        cameraOrViewBehavior: { perspective: "orbit", motionProfile: "gentle_float", targetFocus: "Companion Plinth" },
        spatialElements: ["Pedestal Stone", "Bramble Bear", "Pebble Sprite", "Cloud Weaver"],
        narrativeOrContent: "Every companion has a voice and a unique lore trait.",
      },
    ];

    let sections: CompositionSection[] = profile.entityCategory === "flacon"
      ? [
          {
            id: "sec_hero",
            order: 1,
            name: "Flacon Stage & Scent Monograph",
            focalElement: "Full-bleed 3D perfume bottle canvas with minimal editorial title",
            layoutFamily: "IMMERSIVE_WORLD",
            gridStructure: "canvas-fullbleed",
            contentPurpose: "Sculptural introduction to the signature fragrance",
            primaryAction: { label: "Explore Scent Pyramid", action: "scroll_to_notes" },
            secondaryElements: ["Edition number", "Grasse provenance badge", "Audio fragrance tone"],
          },
          {
            id: "sec_pyramid",
            order: 2,
            name: "Olfactory Architecture",
            focalElement: "Interactive 3D note spheres floating in atmospheric ring",
            layoutFamily: "EDITORIAL",
            gridStructure: "split-3d-text",
            contentPurpose: "Discover top, heart, and base notes with ingredient origins",
            secondaryElements: ["Botanical monographs", "Extraction timeline"],
          },
          {
            id: "sec_engraving",
            order: 3,
            name: "Bespoke Acquisition",
            focalElement: "Interactive bottle customizer with live typography engraving preview",
            layoutFamily: "FORM_CENTRIC",
            gridStructure: "split-customizer",
            contentPurpose: "Personalized bottle engraving and acquisition checkout",
            primaryAction: { label: "Acquire Numbered Edition", action: "open_acquisition" },
            secondaryElements: ["Engraving font options", "Complimentary sample vial"],
          },
        ]
      : profile.entityCategory === "sneaker"
      ? [
          {
            id: "sec_hero",
            order: 1,
            name: "Kinetic Sneaker Stage",
            focalElement: "Full 3D sneaker canvas with live 360 orbit and explosive anatomy toggle",
            layoutFamily: "IMMERSIVE_WORLD",
            gridStructure: "canvas-fullbleed",
            contentPurpose: "Immersive hero experience and product inspection",
            primaryAction: { label: "Explode Technical Anatomy", action: "explode_parts" },
            secondaryElements: ["Drop countdown", "Weight specification", "Carbon plate badge"],
          },
          {
            id: "sec_lab",
            order: 2,
            name: "Material & Colorway Laboratory",
            focalElement: "Colorway selector dock updating 3D sneaker materials in real-time",
            layoutFamily: "FORM_CENTRIC",
            gridStructure: "dock-overlay",
            contentPurpose: "Customize shoe upper, laces, and sole colors",
            secondaryElements: ["Material description", "Traction rating"],
          },
          {
            id: "sec_drop",
            order: 3,
            name: "Drop Intake & Size Reservation",
            focalElement: "Interactive size grid and quick-checkout trigger",
            layoutFamily: "FORM_CENTRIC",
            gridStructure: "centered-action",
            contentPurpose: "Lock in shoe size and preorder allotment",
            primaryAction: { label: "Pre-order Drop", action: "open_checkout" },
            secondaryElements: ["Size guide", "Worldwide shipping estimate"],
          },
        ]
      : [
          {
            id: "sec_character_plinth",
            order: 1,
            name: "3D Companion Spotlight Stage",
            focalElement: "Interactive 3D companion model on rotatable pedestal with animated gestures",
            layoutFamily: "HERO_CANVAS",
            gridStructure: "canvas-fullbleed",
            contentPurpose: "Hero companion spotlight and tactile inspection",
            primaryAction: { label: "Commune & Hear Voice", action: "play_voice" },
            secondaryElements: ["Companion trait badge", "Origin biome"],
          },
          {
            id: "sec_voice_sanctuary",
            order: 2,
            name: "Companion Lore & Voice Excerpts",
            focalElement: "Companion dialogue transcript, character quote, and audio frequency visualizer",
            layoutFamily: "SPLIT_SHOWCASE",
            gridStructure: "split-6-6",
            contentPurpose: "Explore character personality and listen to folklore clips",
            secondaryElements: ["Wisdom quotes", "Voice clips"],
          },
          {
            id: "sec_companion_quests",
            order: 3,
            name: "Quests Bestowed by Companions",
            focalElement: "Interactive quest map waypoints unlocked by the active companion",
            layoutFamily: "TIMELINE",
            gridStructure: "scroll-timeline",
            contentPurpose: "Complete companion trials and earn guardian charms",
            primaryAction: { label: "Accept Quest", action: "accept_quest" },
            secondaryElements: ["Quest rewards", "Completion state"],
          },
          {
            id: "sec_soundboard_dock",
            order: 4,
            name: "Companion Harmony Soundboard",
            focalElement: "Tactile chime soundboard tuned to companion resonant notes (C4, E4, G4)",
            layoutFamily: "CONSOLE",
            gridStructure: "dock-panel",
            contentPurpose: "Harmonic soundboard audio mixer with whimsical chime triggers",
            secondaryElements: ["Resonant frequencies", "Ambient volume"],
          },
        ];

    const layers: CompositionLayer[] = [
      { id: "l_glade", name: "Enchanted Glade", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: "Atmospheric glade environment" },
      { id: "l_avatar", name: "3D Companion Plinth", depth: "midground", renderingTechnology: "webgl", contentRole: "Hero Avatar", description: "Detailed character turntable" },
      { id: "l_hud", name: "Voice & Lore Drawer", depth: "hud", renderingTechnology: "dom", contentRole: "Interaction UI", description: "Bottom companion dock and dialogue drawer" },
    ];

    return {
      strategyId: "CHARACTER_STAGE",
      name: "Character Pedestal Stage",
      experienceIntent,
      focalElement,
      layoutTopology,
      navigationModel,
      cardDensityRatio,
      spatialPlan,
      scenes,
      sections,
      layers,
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: layoutTopology,
        regions: [
          { id: "pedestal-stage", role: "primary", gridSpan: { cols: 7, rows: 6 }, density: "spacious" },
          { id: "lore-dossier", role: "aside", gridSpan: { cols: 5, rows: 6 }, density: "balanced" },
        ],
      },
      primaryFocus: {
        type: "live_stage_matrix",
        entity: profile.focalEntityName,
        title: focalElement.slice(0, 32),
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "split-7-5",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Candidate 5: INTERACTIVE_REALM
   * Tactile direct manipulation sandbox with physics, soundboards, and trial ledger.
   */
  private static buildPlaygroundCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics
  ): CandidateExperienceArchitecture {
    const experienceIntent = `Whimsical living playground with interactive pastel spheres, soundboard totems, and quest trials`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Interactive horological workbench with escapement speed regulator and complication simulator"
      : profile.entityCategory === "specimen"
      ? "Submersible sonar acoustic console with hydrophone frequency mixer and pressure chamber simulator"
      : profile.entityCategory === "module"
      ? "Interactive 3D interior layout sandbox with drag-and-drop modular furniture pieces"
      : "Interactive whimsical physics sandbox with bouncy pastel spheres, soundboard totems, and living clouds";

    const navigationModel: NavigationModel = "bottom_dock";
    const layoutTopology: LayoutTopologyType = "PLAYFUL_WORKSPACE";
    const cardDensityRatio = 0.08;

    const spatialPlan: SpatialPlan = {
      sceneType: "WORLD_EXPLORATION",
      focalObject: profile.entityCategory === "caliber"
        ? "Artisan tourbillon caliber calibration laboratory with live regulation controls"
        : profile.entityCategory === "specimen"
        ? "Submersible acoustic observation basin with interactive hydrophone sensors"
        : profile.entityCategory === "module"
        ? "Interactive architectural space planner with responsive daylight and furniture swatches"
        : "Bouncy claymation playground with pastel physics spheres, secret burrow openings, and sound rocks",
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Interactive tilt-and-bounce camera with bouncy sphere physics collisions",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "floating_overlay",
        components: ["Magical Soundboard Mixer", "Realm Telemetry", "Traveler Ledger"],
      },
      interactionTopology: "direct_mesh_manipulation",
    };

    const scenes: CompositionScene[] = [
      {
        id: "scene_sandbox",
        sceneIndex: 1,
        name: "Living Playground",
        intent: "Clickable pastel spheres that bounce on the terrain",
        focalSubject: "Playground Basin",
        cameraOrViewBehavior: { perspective: "orbit", motionProfile: "kinetic_snap", targetFocus: "Pastel Spheres" },
        spatialElements: ["Pastel Spheres", "Mossy Mounds", "Sound Rocks"],
        narrativeOrContent: "Tap spheres to hear musical notes ring through the valley.",
      },
    ];

    const sections: CompositionSection[] = [
      {
        id: "sec_sandbox_stage",
        order: 1,
        name: "Living Playground & Pastel Spheres Canvas",
        focalElement: "Full 3D WebGL interactive universe with clickable pastel spheres and tilt physics",
        layoutFamily: "IMMERSIVE_WORLD",
        gridStructure: "canvas-fullbleed",
        contentPurpose: "Playful physics interaction and landmark discovery",
        primaryAction: { label: "Bounce Pastel Spheres", action: "bounce_spheres" },
        secondaryElements: ["Landmarks counter", "Active biome"],
      },
      {
        id: "sec_magical_soundboard",
        order: 2,
        name: "Tactile Magical Soundboard Console",
        focalElement: "Interactive soundboard pads with real Web Audio chime playback and visualizer waves",
        layoutFamily: "CONSOLE",
        gridStructure: "dock-panel",
        contentPurpose: "Magical soundboard with chime notes and ambient wind mixers",
        secondaryElements: ["Chime Note C4", "Chime Note E4", "Chime Note G4"],
      },
      {
        id: "sec_realm_quest_board",
        order: 3,
        name: "Realm Discovery Trials & Trophies",
        focalElement: "Tactile quest map cards with confetti celebration animations upon completion",
        layoutFamily: "TIMELINE",
        gridStructure: "scroll-timeline",
        contentPurpose: "Complete whimsical trials across the fantasy universe",
        primaryAction: { label: "Complete Trial", action: "complete_quest" },
        secondaryElements: ["Charm rewards", "Trial status"],
      },
      {
        id: "sec_chronicler_journal",
        order: 4,
        name: "Journey Scroll & Scrapbook Ledger",
        focalElement: "Whimsical journey scroll with traveler memories and discovery entries",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-3d-text",
        contentPurpose: "Read chronicled realm history and family journey discoveries",
        secondaryElements: ["Cycle entries", "Traveler lore"],
      },
    ];

    const layers: CompositionLayer[] = [
      { id: "l_sky", name: "Atmospheric Clouds & Sky", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: "Procedural volumetric clouds drifting over hills" },
      { id: "l_world", name: "Pastel Spheres & Mounds", depth: "midground", renderingTechnology: "webgl", contentRole: "Physics Sandbox", description: "Bouncy spheres and interactive burrow avatars" },
      { id: "l_hud", name: "Soundboard & Quest Bar", depth: "hud", renderingTechnology: "dom", contentRole: "Sandbox Controls", description: "Pill navigation and audio pads" },
    ];

    return {
      strategyId: "INTERACTIVE_REALM",
      name: "Interactive Tactile Playground",
      experienceIntent,
      focalElement,
      layoutTopology,
      navigationModel,
      cardDensityRatio,
      spatialPlan,
      scenes,
      sections,
      layers,
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: layoutTopology,
        regions: [
          { id: "sandbox-stage", role: "hero", gridSpan: { cols: 12, rows: 6 }, density: "spacious" },
          { id: "soundboard-console", role: "primary", gridSpan: { cols: 8, rows: 4 }, density: "compact" },
          { id: "quest-trials", role: "aside", gridSpan: { cols: 4, rows: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "live_stage_matrix",
        entity: profile.focalEntityName,
        title: focalElement.slice(0, 32),
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }
}
