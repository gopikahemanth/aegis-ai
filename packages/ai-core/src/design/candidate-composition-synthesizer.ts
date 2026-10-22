/**
 * CandidateCompositionSynthesizer
 *
 * Generic generative experience engine that derives multiple structurally valid,
 * distinct composition architecture candidates directly from product semantics:
 * - Product meaning & intent
 * - Audience & emotional tone
 * - Visual personality & materials
 * - Primary activity & key interactions
 * - Required capabilities (3D, audio, interactive exploration, telemetry, etc.)
 *
 * SYSTEM INVARIANT:
 * "Aegis must never use hardcoded domain-specific strategy tables. Instead, candidate
 * architectures are dynamically synthesized from the product's actual semantics,
 * and selected/perturbed by the generation seed."
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

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "section";
}

function humanizeFeatureName(raw: string): string {
  let s = (raw || "").trim();
  s = s.replace(/^(?:users?\s+(?:should|can|will)|explore\s+the|explore|inspect|view|interact\s+with|change|monitor|manage|configure|toggle|track|move\s+between)\s+/i, "");
  s = s.replace(/[,.;]+$/, "");
  s = s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return s || raw;
}

function extractFeatureNoun(name: string): string {
  let s = (name || "").trim();
  s = s.replace(/^(?:Interactive|Real-Time|Live|Dynamic|Comprehensive)\s+/i, "");
  s = s.replace(/\s+Views?$/i, "");
  s = s.replace(/\s+Systems?$/i, " Systems");
  return s || name;
}

function extractKeywordsFromDescription(desc: string): string[] {
  const words = (desc || "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 4 && !/^(about|which|their|these|those|using|under|above|between|during|before|after|through|with|from)$/i.test(w));
  const unique = Array.from(new Set(words));
  return unique.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export interface SectionPlanContext {
  prompt?: string;
  rawPrompt?: string;
  characteristics?: ProductCharacteristics;
  capabilityPlan?: ExperienceCapabilityPlan;
  domainContract?: any;
  specification?: any;
  rawSpec?: any;
  featureDescriptions?: Record<string, string>;
  domainVocabulary?: any;
  features?: string[];
}

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
    specification?: any;
    rawSpec?: any;
    features?: string[];
    featureDescriptions?: Record<string, string>;
    domainVocabulary?: any;
  }): CandidateExperienceArchitecture[] {
    const raw = (options.prompt || "").toLowerCase();
    const { characteristics, capabilityPlan } = options;

    const isSpatial =
      capabilityPlan.real3dRequired ||
      capabilityPlan.experienceType === "IMMERSIVE_3D" ||
      capabilityPlan.experienceType === "WEBGL_EXPERIENCE";

    if (isSpatial) {
      return this.synthesizeSpatialCandidates(raw, characteristics, capabilityPlan, options.domainContract, options);
    }

    return this.synthesizeNonSpatialCandidates(raw, characteristics, capabilityPlan, options.domainContract);
  }

  /**
   * Derives a structured section plan from the project context:
   * rawSpec.sectionPlan, specification features, featureDescriptions, domainVocabulary,
   * or the user prompt. One section per feature, named after the feature,
   * with the focal subject taken from the feature noun.
   */
  public static deriveSectionPlan(ctx: SectionPlanContext): CompositionSection[] {
    const rawSpec = ctx.rawSpec || ctx.specification?.rawSpec;
    if (rawSpec?.sectionPlan && Array.isArray(rawSpec.sectionPlan) && rawSpec.sectionPlan.length > 0) {
      return rawSpec.sectionPlan.map((s: any, idx: number) => ({
        id: s.id || `sec_${s.name ? slugify(s.name) : `section_${idx + 1}`}`,
        order: s.order || idx + 1,
        name: s.name || `Section ${idx + 1}`,
        focalElement: s.focalElement || `Interactive 3D ${s.focalSubject || s.name} presentation`,
        layoutFamily: s.layoutFamily || (idx === 0 ? "IMMERSIVE_WORLD" : idx === 1 ? "SPLIT_SHOWCASE" : idx === 2 ? "CONSOLE" : "TIMELINE"),
        gridStructure: s.gridStructure || (idx === 0 ? "canvas-fullbleed" : idx === 1 ? "split-6-6" : idx === 2 ? "dock-panel" : "scroll-timeline"),
        contentPurpose: s.contentPurpose || s.purpose || `Interactive ${s.name} module`,
        primaryAction: s.primaryAction || { label: `Inspect ${s.focalSubject || s.name}`, action: `inspect_${slugify(s.name || `feat_${idx}`)}` },
        secondaryElements: s.secondaryElements || [`${s.name} status`, `${s.name} controls`],
      }));
    }

    const prompt = ctx.prompt || ctx.rawPrompt || "";
    const featureDescriptions = ctx.featureDescriptions || ctx.specification?.featureDescriptions || {};
    let featureList: string[] = [];

    if (Array.isArray(ctx.features) && ctx.features.length > 0) {
      featureList = [...ctx.features];
    } else if (Array.isArray(ctx.specification?.features) && ctx.specification.features.length > 0) {
      featureList = [...ctx.specification.features];
    } else if (Object.keys(featureDescriptions).length > 0) {
      featureList = Object.keys(featureDescriptions);
    } else if (Array.isArray(ctx.domainContract?.entities) && ctx.domainContract.entities.length > 0) {
      featureList = ctx.domainContract.entities.map((e: any) => typeof e === "string" ? e : e.name);
    } else {
      featureList = this.extractFeaturesFromPrompt(prompt);
    }

    if (featureList.length === 0) {
      featureList = ["Core Architecture", "Interactive Systems", "Diagnostics & Telemetry", "Operational Controls"];
    }

    const layoutFamilies = ["IMMERSIVE_WORLD", "SPLIT_SHOWCASE", "CONSOLE", "TIMELINE", "FORM_CENTRIC"];
    const gridStructures = ["canvas-fullbleed", "split-6-6", "dock-panel", "scroll-timeline", "split-form-schedule"];

    const domainVocab = ctx.domainVocabulary || ctx.specification?.domainVocabulary;
    const actionVerbs = domainVocab?.actionVerbs || ["Inspect", "Explore", "Configure", "Analyze", "Monitor"];

    return featureList.slice(0, 5).map((feat, idx) => {
      const cleanName = humanizeFeatureName(feat);
      const featureNoun = extractFeatureNoun(cleanName);
      const slug = slugify(cleanName);
      const desc = featureDescriptions[feat] || featureDescriptions[cleanName] || "";
      const actionVerb = actionVerbs[idx % actionVerbs.length] || "Inspect";

      const secondaryElements: string[] = [];
      if (domainVocab?.primaryMetrics?.[idx]) {
        secondaryElements.push(domainVocab.primaryMetrics[idx]);
      }
      if (desc) {
        const keywords = extractKeywordsFromDescription(desc);
        secondaryElements.push(...keywords.slice(0, 2));
      }
      if (secondaryElements.length < 2) {
        secondaryElements.push(`${featureNoun} Status`, `${featureNoun} Telemetry`);
      }

      return {
        id: `sec_${slug}`,
        order: idx + 1,
        name: cleanName,
        focalElement: `Interactive 3D ${featureNoun} with spatial inspection and telemetry overlay`,
        layoutFamily: layoutFamilies[idx % layoutFamilies.length],
        gridStructure: gridStructures[idx % gridStructures.length],
        contentPurpose: desc ? desc.split(".")[0] + "." : `Comprehensive inspection and telemetry controls for ${featureNoun}`,
        primaryAction: {
          label: `${actionVerb} ${featureNoun}`,
          action: `${actionVerb.toLowerCase()}_${slug}`,
        },
        secondaryElements: secondaryElements.slice(0, 3),
      };
    });
  }

  private static deriveScenesPlan(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    sections: CompositionSection[]
  ): CompositionScene[] {
    return sections.map((sec, idx) => {
      const cameraBehaviors: Array<{
        perspective: "orbit" | "scroll_dolly" | "first_person" | "fixed_cinematic" | "top_down";
        motionProfile: "gentle_float" | "kinetic_snap" | "slow_axial_orbit" | "smooth_pan";
        targetFocus: string;
      }> = [
        { perspective: "orbit", motionProfile: "gentle_float", targetFocus: sec.name },
        { perspective: "scroll_dolly", motionProfile: "kinetic_snap", targetFocus: sec.name },
        { perspective: "top_down", motionProfile: "slow_axial_orbit", targetFocus: sec.name },
        { perspective: "first_person", motionProfile: "smooth_pan", targetFocus: sec.name },
      ];
      const noun = extractFeatureNoun(sec.name);
      return {
        id: `scene_${sec.id.replace("sec_", "")}`,
        sceneIndex: idx + 1,
        name: sec.name,
        intent: sec.contentPurpose,
        focalSubject: noun,
        cameraOrViewBehavior: cameraBehaviors[idx % cameraBehaviors.length],
        spatialElements: [noun, ...sec.secondaryElements],
        hudElements: [`${noun} Telemetry`, `${noun} Controls`],
        interactiveControls: [sec.primaryAction?.label || `Inspect ${noun}`, "Reset Perspective"],
        narrativeOrContent: sec.contentPurpose,
      };
    });
  }

  private static extractFeaturesFromPrompt(rawPrompt: string): string[] {
    const prompt = (rawPrompt || "").replace(/\r?\n/g, " ");
    const features: string[] = [];

    const featMatch = prompt.match(/features?:\s*([^.]+)/i);
    if (featMatch && featMatch[1]) {
      const items = featMatch[1].split(/,|;|and\s+/i).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) return items.map(s => humanizeFeatureName(s));
    }

    const actionMatch = prompt.match(/(?:users?\s+(?:should|can|will)|offering|includes?|featuring)\s+([^.]+)/i);
    if (actionMatch && actionMatch[1]) {
      const items = actionMatch[1].split(/,|;|and\s+/i).map(s => s.trim()).filter(s => s.length > 3);
      if (items.length >= 2) return items.map(s => humanizeFeatureName(s));
    }

    const withMatch = prompt.match(/\bwith\s+([^.]+)/i);
    if (withMatch && withMatch[1]) {
      const items = withMatch[1].split(/,|;|and\s+/i).map(s => s.trim()).filter(s => s.length > 2);
      if (items.length >= 2) return items.map(s => humanizeFeatureName(s));
    }

    const clauses = prompt.split(/[,.;]/).map(s => s.trim()).filter(s => s.length > 8);
    for (const clause of clauses) {
      if (/(?:explore|inspect|view|interact|navigate|monitor|control|track|manage|configure|simulate|schedule|switch|cutaways|telemetry|sensor)/i.test(clause)) {
        features.push(humanizeFeatureName(clause));
      }
    }

    if (features.length >= 2) return features;

    return ["Interactive Model Stage", "Structural Inspection", "Telemetry & Controls", "Operational Systems"];
  }

  /**
   * Synthesizes 5 distinct archetypal spatial candidates derived from the product's actual features and semantics.
   */
  private static synthesizeSpatialCandidates(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any,
    options?: any
  ): CandidateExperienceArchitecture[] {
    const semanticProfile = this.extractSpatialSemanticProfile(rawPrompt, characteristics, capabilityPlan);

    const ctx: SectionPlanContext = {
      prompt: rawPrompt,
      rawPrompt,
      characteristics,
      capabilityPlan,
      domainContract,
      specification: options?.specification,
      rawSpec: options?.rawSpec || options?.specification?.rawSpec,
      featureDescriptions: options?.featureDescriptions || options?.specification?.featureDescriptions,
      domainVocabulary: options?.domainVocabulary || options?.specification?.domainVocabulary,
      features: options?.features || options?.specification?.features,
    };

    const candidateA = this.buildExpeditionCandidate(semanticProfile, characteristics, ctx);
    const candidateB = this.buildCinematicCandidate(semanticProfile, characteristics, ctx);
    const candidateC = this.buildSpatialAtlasCandidate(semanticProfile, characteristics, ctx);
    const candidateD = this.buildFocalStageCandidate(semanticProfile, characteristics, ctx);
    const candidateE = this.buildPlaygroundCandidate(semanticProfile, characteristics, ctx);

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
          gridStructure: "grid-cards",
          contentPurpose: `Primary discovery interface for ${primaryObject}`,
          secondaryElements: ["Sorting options", "Filter chips"],
        },
        {
          id: "sec_action_drawer",
          order: 3,
          name: `${primaryObject} Detail & Action Drawer`,
          focalElement: `Slide-out sheet with rich metadata and acquisition actions for ${primaryObject}`,
          layoutFamily: "FORM_CENTRIC",
          gridStructure: "drawer-panel",
          contentPurpose: `Inspect selected ${primaryObject} and proceed to execution`,
          primaryAction: { label: `Add to Selection`, action: "add_item" },
          secondaryElements: ["Availability status", "Variant options"],
        },
      ],
      intent: "TRANSACT_BROWSE",
      topology: {
        type: "PORTAL_HERO_SHOWCASE",
        regions: [
          { id: "banner", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "catalog", role: "primary", gridSpan: { cols: 8 }, density: "dense" },
          { id: "sidebar", role: "aside", gridSpan: { cols: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "catalog_grid",
        entity: primaryObject,
        title: `Curated ${primaryObject} Collection`,
        description: `Comprehensive discovery interface for ${primaryObject}`,
        density: "dense",
      },
      widgets: [],
      interactions: [],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-8-col",
        mobile: "single-column-flow",
      },
    };

    // Candidate 3: High-Density Diagnostic Command Console
    const candConsole: CandidateExperienceArchitecture = {
      strategyId: "HIGH_DENSITY_CONSOLE",
      name: "Tactile Diagnostic Command Console",
      experienceIntent: `High-density multi-panel telemetry console with live charts, status feeds, and direct control ledger for ${primaryObject}`,
      focalElement: `Live status matrix with sparkline charts, status lights, and telemetry indicators for ${primaryObject}`,
      layoutTopology: "OPERATIONAL_COMMAND_CONSOLE",
      navigationModel: "sidebar",
      cardDensityRatio: 0.65,
      scenes: [],
      layers: [],
      sections: [
        {
          id: "sec_kpi_matrix",
          order: 1,
          name: `${primaryObject} Operational KPI Matrix`,
          focalElement: `Dense grid of 4-6 real-time status metric meters for ${primaryObject}`,
          layoutFamily: "CONSOLE",
          gridStructure: "metric-grid-4",
          contentPurpose: `Immediate health, throughput, and status overview for ${primaryObject}`,
          primaryAction: { label: "Run System Diagnostics", action: "trigger_diagnostic" },
          secondaryElements: ["Refresh interval", "Alert status indicator"],
        },
        {
          id: "sec_telemetry_stream",
          order: 2,
          name: `${primaryObject} Realtime Status Feed`,
          focalElement: "Multi-channel continuous telemetry feed with threshold alerting",
          layoutFamily: "CONSOLE",
          gridStructure: "split-panel-charts",
          contentPurpose: "Continuous telemetry tracking and anomaly detection",
          secondaryElements: ["Time range selector", "Channel toggles"],
        },
        {
          id: "sec_control_ledger",
          order: 3,
          name: `${primaryObject} Execution Ledger`,
          focalElement: "Dense tabular audit ledger with inline status switches and quick-action buttons",
          layoutFamily: "CONSOLE",
          gridStructure: "data-table-full",
          contentPurpose: "Audit trail and direct state configuration",
          primaryAction: { label: "Dispatch Command", action: "open_dispatch_modal" },
          secondaryElements: ["Filter by state", "Export CSV"],
        },
      ],
      intent: "MONITOR_CONTROL",
      topology: {
        type: "OPERATIONAL_COMMAND_CONSOLE",
        regions: [
          { id: "rail", role: "navigation", gridSpan: { cols: 2 }, density: "compact" },
          { id: "kpi", role: "hero", gridSpan: { cols: 10 }, density: "dense" },
          { id: "main-console", role: "primary", gridSpan: { cols: 7 }, density: "dense" },
          { id: "ledger", role: "secondary", gridSpan: { cols: 3 }, density: "dense" },
        ],
      },
      primaryFocus: {
        type: "telemetry_console",
        entity: primaryObject,
        title: `${primaryObject} Operations Console`,
        description: `Operational command console for ${primaryObject}`,
        density: "dense",
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
    let primarySubject = "interactive 3D world";
    let focalEntityName = "World Stage";
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
    } else if (rawPrompt.includes("kazzoo") || rawPrompt.includes("claymation") || rawPrompt.includes("animated")) {
      primarySubject = "whimsical 3D animated universe";
      focalEntityName = "Animated World Stage";
      entityCategory = "character";
    } else if (rawPrompt.includes("ocean") || rawPrompt.includes("underwater") || rawPrompt.includes("submersible") || rawPrompt.includes("abyssal") || rawPrompt.includes("thalassa") || rawPrompt.includes("habitat")) {
      primarySubject = "deep sea underwater architectural habitat";
      focalEntityName = "Underwater Research Habitat";
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

    let environmentDescription = "Tactile ambient lighting with procedural volumetric atmosphere and soft directional illumination";
    let lightingModel = "Warm ambient daylight with soft directional sunlight casting realistic contact shadows";
    let materialsDescription = "Physically based materials (roughness 0.5, metalness 0.1) with rich contextual surface texturing";

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
    } else if (rawPrompt.includes("ocean") || rawPrompt.includes("underwater") || rawPrompt.includes("marine") || rawPrompt.includes("thalassa") || rawPrompt.includes("habitat")) {
      environmentDescription = "Deep oceanic abyssal void with bioluminescent particles and shimmering water caustics";
      lightingModel = "Submersible dual halogen beam lighting cutting through deep ocean darkness with soft blue backfill";
      materialsDescription = "Deep ocean water shader, refractive pressure glass, and structural titanium composite";
    } else if (rawPrompt.includes("watch") || rawPrompt.includes("atelier") || rawPrompt.includes("luxury")) {
      environmentDescription = "Dark studio void with brushed graphite plinth, warm golden grazing rim light, and floating dust";
      lightingModel = "Precision chiaroscuro spotlighting with anisotropic highlights on brushed metal bevels and polished anglage";
      materialsDescription = "Brushed grade-5 titanium, 18k 5N rose gold, anti-reflective sapphire crystal, and vitreous enamel";
    } else if (rawPrompt.includes("furniture") || rawPrompt.includes("architectural")) {
      environmentDescription = "Sun-drenched architectural pavilion with natural oak planking and soft daylight diffused through floor-to-ceiling glass";
      lightingModel = "Natural northern daylight with soft ambient bounce light and gentle ground contact shadows";
      materialsDescription = "Full-grain aniline leather, oiled solid walnut, brushed champagne brass, and bouclé textile weave";
    }

    const hasCharacters = rawPrompt.includes("character") || rawPrompt.includes("avatar") || rawPrompt.includes("specimen") || rawPrompt.includes("inhabitant");
    const hasMissions = rawPrompt.includes("mission") || rawPrompt.includes("trial") || rawPrompt.includes("challenge") || rawPrompt.includes("expedition");
    const hasAudio = (capabilityPlan as any).audioSupported || (capabilityPlan as any).ambientAudioSupported || rawPrompt.includes("voice") || rawPrompt.includes("audio") || rawPrompt.includes("chime") || rawPrompt.includes("hydrophone");
    const hasTimeline = rawPrompt.includes("scroll") || rawPrompt.includes("timeline") || rawPrompt.includes("logbook") || rawPrompt.includes("chronicle");

    return {
      primarySubject,
      focalEntityName,
      entityCategory,
      environmentDescription,
      lightingModel,
      materialsDescription,
      hasCharacters,
      hasMissions,
      hasAudio,
      hasTimeline,
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
    characteristics: ProductCharacteristics,
    ctx: SectionPlanContext
  ): CandidateExperienceArchitecture {
    const sections = this.deriveSectionPlan(ctx);
    const scenes = this.deriveScenesPlan(profile, sections);
    const primarySection = sections[0];
    const experienceIntent = `Immersive 3D ${profile.primarySubject} with interactive spatial exploration, real-time telemetry, and module inspection`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Hand-finished tourbillon timepiece in grade-5 titanium and 18k rose gold with interactive 360-degree rotation"
      : profile.entityCategory === "specimen"
      ? "Abyssal research habitat with structural modules, cutaway viewing planes, and volumetric lighting"
      : profile.entityCategory === "module"
      ? "Architectural modular seating centerpiece with customizable tactile materials and proportions"
      : `Interactive 3D ${primarySection ? extractFeatureNoun(primarySection.name) : profile.primarySubject} stage with volumetric atmosphere and status beacons`;

    const navigationModel = "immersive-hud" as any;
    const layoutTopology: LayoutTopologyType = "PLAYFUL_WORKSPACE";
    const cardDensityRatio = 0.08;

    const spatialPlan: SpatialPlan = {
      sceneType: "WORLD_EXPLORATION",
      focalObject: profile.entityCategory === "caliber"
        ? "Artisan tourbillon watch with sapphire crystal, grand feu enamel dial, and exhibition caseback"
        : profile.entityCategory === "specimen"
        ? "Deep sea abyssal research submersible and habitat facility with pressurized marine modules, external manipulator arrays, and telemetry sensors"
        : profile.entityCategory === "module"
        ? "Modular architectural furniture suite in daylight interior pavilion"
        : `Floating 3D island terrain stage with tactile contours, landmark beacons, and responsive inspection points`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Gentle smooth orbit camera with responsive landmark focusing on user click",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "floating_overlay",
        components: sections.map(s => `${extractFeatureNoun(s.name)} Telemetry`).slice(0, 4),
      },
      interactionTopology: "raycast_inspection",
    };

    const layers: CompositionLayer[] = [
      { id: "l_env", name: "Atmospheric Environment", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: profile.environmentDescription },
      { id: "l_stage", name: `${primarySection ? extractFeatureNoun(primarySection.name) : "3D Stage"} Model`, depth: "midground", renderingTechnology: "webgl", contentRole: "Primary Model", description: profile.materialsDescription },
      { id: "l_hud", name: "Floating HUD & Interface Dock", depth: "hud", renderingTechnology: "dom", contentRole: "User Interface", description: "Interactive telemetry overlays, status cards, and navigation" },
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
          { id: "telemetry-hud", role: "aside", gridSpan: { cols: 4, rows: 4 }, density: "compact" },
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
    characteristics: ProductCharacteristics,
    ctx: SectionPlanContext
  ): CandidateExperienceArchitecture {
    const baseSections = this.deriveSectionPlan(ctx);
    const sections: CompositionSection[] = baseSections.map((s, idx) => ({
      ...s,
      layoutFamily: idx === 0 ? "HERO_CANVAS" : idx === 1 ? "EDITORIAL" : idx === 2 ? "TIMELINE" : "CONSOLE",
      gridStructure: idx === 0 ? "canvas-fullbleed" : idx === 1 ? "split-3d-text" : idx === 2 ? "scroll-timeline" : "dock-panel",
    }));
    const scenes = this.deriveScenesPlan(profile, sections);
    const primarySection = sections[0];

    const experienceIntent = `Cinematic 3D ${profile.primarySubject} scroll journey through interactive systems, focal viewpoints, and atmospheric audio`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Cinematic slow-orbit tourbillon centerpiece with macro focal transitions across dial indices"
      : profile.entityCategory === "specimen"
      ? "Submersible architectural descent journey tracking pressure hulls and internal decks"
      : profile.entityCategory === "module"
      ? "Architectural furniture craft journey following joinery, material selection, and final hand finishing"
      : `Panoramic 3D cinematic ${primarySection ? extractFeatureNoun(primarySection.name) : profile.primarySubject} with volumetric atmosphere and milestone waypoints`;

    const navigationModel: NavigationModel = "floating_pills";
    const layoutTopology: LayoutTopologyType = "PORTAL_HERO_SHOWCASE";
    const cardDensityRatio = 0.06;

    const spatialPlan: SpatialPlan = {
      sceneType: "NARRATIVE_JOURNEY",
      focalObject: profile.entityCategory === "caliber"
        ? "Artisan tourbillon watch with sapphire crystal, grand feu enamel dial, and exhibition caseback"
        : profile.entityCategory === "specimen"
        ? "Descending research habitat complex traversing benthic marine zones and deep hydrothermal plumes"
        : profile.entityCategory === "module"
        ? "Handcrafted solid walnut joinery framework with bespoke leather upholstery layers"
        : `Contoured structural terrain stage with interactive landmark inspection nodes and environmental sensors`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Cinematic scroll-linked dolly camera gliding along architectural terrain pass",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "minimal_compass",
        components: sections.map(s => `${extractFeatureNoun(s.name)} Marker`).slice(0, 3),
      },
      interactionTopology: "scroll_driven_orbit",
    };

    const layers: CompositionLayer[] = [
      { id: "l_env", name: "Atmospheric Lighting", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: profile.environmentDescription },
      { id: "l_stage", name: "Interactive System Mesh", depth: "midground", renderingTechnology: "webgl", contentRole: "Living World", description: profile.materialsDescription },
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
    characteristics: ProductCharacteristics,
    ctx: SectionPlanContext
  ): CandidateExperienceArchitecture {
    const baseSections = this.deriveSectionPlan(ctx);
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
      : baseSections.map((s, idx) => ({
          ...s,
          layoutFamily: idx === 0 ? "IMMERSIVE_WORLD" : idx === 1 ? "SPLIT_SHOWCASE" : idx === 2 ? "EDITORIAL" : "CONSOLE",
          gridStructure: idx === 0 ? "canvas-fullbleed" : idx === 1 ? "split-6-6" : idx === 2 ? "split-3d-text" : "dock-panel",
        }));
    const scenes = this.deriveScenesPlan(profile, sections);
    const primarySection = sections[0];

    const experienceIntent = `Spatial cartography & landmark atlas with 3D terrain topography, system waypoints, and telemetry nodes`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Exploded caliber complication matrix with separated balance wheel, tourbillon cage, and bridges"
      : profile.entityCategory === "specimen"
      ? "Bathymetric ocean floor relief model with coordinates of research modules and abyssal cutaways"
      : profile.entityCategory === "module"
      ? "Architectural spatial matrix and blueprint layout with modular component specifications"
      : `Interactive 3D topological atlas map with active system landmarks and animated waypoint trails`;

    const navigationModel: NavigationModel = profile.entityCategory === "orrery" ? ("orbital-ring-compass" as any) : "floating_pills";
    const layoutTopology: LayoutTopologyType = "ASYMMETRIC_SPLIT_PANE";
    const cardDensityRatio = 0.07;

    const spatialPlan: SpatialPlan = {
      sceneType: "SPATIAL_EXHIBITION",
      focalObject: profile.entityCategory === "caliber"
        ? "Exploded caliber complication assembly of manufacture movement with floating tourbillon components"
        : profile.entityCategory === "specimen"
        ? "Bathymetric ocean floor relief model with coordinates of research modules and deep trench cutaways"
        : profile.entityCategory === "module"
        ? "Architectural floorplan spatial matrix with configurable furniture modules"
        : profile.entityCategory === "orrery"
        ? "Full scale 3D procedural Solar system orrery with central sun, orbiting textured planets, and asteroid belt"
        : `Topological relief model stage with system node markers, module coordinates, and telemetry landmark beacons`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Topological spatial atlas view with bird's-eye panning and telemetry pin focusing",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "perimeter_dock",
        components: sections.map(s => `${extractFeatureNoun(s.name)} HUD`).slice(0, 3),
      },
      interactionTopology: "poi_teleport",
    };

    const layers: CompositionLayer[] = [
      { id: "l_env", name: "Atmospheric Lighting", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: profile.environmentDescription },
      { id: "l_stage", name: "Topological Relief Mesh", depth: "midground", renderingTechnology: "webgl", contentRole: "Atlas Terrain", description: profile.materialsDescription },
      { id: "l_hud", name: "Compass & Landmark Radar", depth: "hud", renderingTechnology: "dom", contentRole: "Navigation HUD", description: "Perimeter coordinate instruments and telemetry cards" },
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
   * 360-degree pedestal spotlight inspecting an active model or entity.
   */
  private static buildFocalStageCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics,
    ctx: SectionPlanContext
  ): CandidateExperienceArchitecture {
    const baseSections = this.deriveSectionPlan(ctx);
    const primarySection = baseSections[0];

    const experienceIntent = `Focused 3D spotlight and inspection stage with rotatable model plinth, audio feedback, and system status`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Hand-finished tourbillon timepiece in grade-5 titanium and 18k rose gold with interactive 360-degree rotation"
      : profile.entityCategory === "specimen"
      ? "3D deep sea habitat specimen turntable with interior cutaway callouts and volumetric lighting"
      : profile.entityCategory === "module"
      ? "3D architectural lounge chair with rotatable plinth and customizable leather materials"
      : `Large 3D focal inspection plinth with animated model display and contextual controls`;

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
        ? "Deep sea research module specimen on floating acoustic observation turntable"
        : profile.entityCategory === "module"
        ? "Sculptural lounge chair on rotating architectural plinth with real-time textile swatches"
        : `Tactile 3D model on rotating pedestal stage with responsive controls`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Pedestal model turntable with close-up inspection and gesture tracking",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "integrated_sidebar",
        components: baseSections.map(s => `${extractFeatureNoun(s.name)} Selector`).slice(0, 3),
      },
      interactionTopology: "direct_mesh_manipulation",
    };

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
      : baseSections;

    const scenes = this.deriveScenesPlan(profile, sections);

    const layers: CompositionLayer[] = [
      { id: "l_env", name: "Atmospheric Studio Lighting", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: profile.environmentDescription },
      { id: "l_stage", name: "3D Model Plinth", depth: "midground", renderingTechnology: "webgl", contentRole: "Hero Avatar", description: profile.materialsDescription },
      { id: "l_hud", name: "Control & Telemetry Drawer", depth: "hud", renderingTechnology: "dom", contentRole: "Interaction UI", description: "Bottom control dock and telemetry drawer" },
    ];

    return {
      strategyId: "CHARACTER_STAGE",
      name: "Model Pedestal Stage",
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
   * Candidate 5: INTERACTIVE_SIMULATION
   * Tactile direct manipulation sandbox with physics, simulation console, and operational metrics.
   */
  private static buildPlaygroundCandidate(
    profile: ReturnType<typeof CandidateCompositionSynthesizer.extractSpatialSemanticProfile>,
    characteristics: ProductCharacteristics,
    ctx: SectionPlanContext
  ): CandidateExperienceArchitecture {
    const baseSections = this.deriveSectionPlan(ctx);
    const sections: CompositionSection[] = baseSections.map((s, idx) => ({
      ...s,
      layoutFamily: idx === 0 ? "IMMERSIVE_WORLD" : idx === 1 ? "CONSOLE" : idx === 2 ? "TIMELINE" : "EDITORIAL",
      gridStructure: idx === 0 ? "canvas-fullbleed" : idx === 1 ? "dock-panel" : idx === 2 ? "scroll-timeline" : "split-3d-text",
    }));
    const scenes = this.deriveScenesPlan(profile, sections);
    const primarySection = sections[0];

    const experienceIntent = `Dynamic living simulation workspace with interactive physics, acoustic console, and operational metrics`;
    const focalElement = profile.entityCategory === "caliber"
      ? "Interactive horological workbench with escapement speed regulator and complication simulator"
      : profile.entityCategory === "specimen"
      ? "Submersible sonar acoustic console with hydrophone frequency mixer and pressure chamber simulator"
      : profile.entityCategory === "module"
      ? "Interactive 3D interior layout sandbox with drag-and-drop modular furniture pieces"
      : `Interactive simulation sandbox with physics objects, telemetry totems, and atmospheric lighting`;

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
        : `Interactive simulation basin with physical entities, telemetry sensors, and acoustic resonance`,
      sceneEnvironment: profile.environmentDescription,
      cameraStrategy: "Interactive tilt-and-pan camera with responsive physics interactions",
      lightingModel: profile.lightingModel,
      materialsAndShaders: profile.materialsDescription,
      spatialHud: {
        placement: "floating_overlay",
        components: sections.map(s => `${extractFeatureNoun(s.name)} Console`).slice(0, 3),
      },
      interactionTopology: "direct_mesh_manipulation",
    };

    const layers: CompositionLayer[] = [
      { id: "l_env", name: "Atmospheric Clouds & Lighting", depth: "background", renderingTechnology: "webgl", contentRole: "Atmosphere", description: profile.environmentDescription },
      { id: "l_stage", name: "Interactive Simulation Stage", depth: "midground", renderingTechnology: "webgl", contentRole: "Physics Sandbox", description: profile.materialsDescription },
      { id: "l_hud", name: "Simulation Controls & HUD", depth: "hud", renderingTechnology: "dom", contentRole: "Sandbox Controls", description: "Pill navigation and simulation controls" },
    ];

    return {
      strategyId: "INTERACTIVE_SIMULATION",
      name: "Interactive Simulation Workspace",
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
          { id: "simulation-console", role: "primary", gridSpan: { cols: 8, rows: 4 }, density: "compact" },
          { id: "telemetry-metrics", role: "aside", gridSpan: { cols: 4, rows: 4 }, density: "compact" },
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
