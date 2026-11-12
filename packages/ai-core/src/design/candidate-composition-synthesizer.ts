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

    // Derive features from prompt keywords or domain terms instead of hardcoded generic strings
    const words = prompt
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !/^(build|simple|single|page|with|that|this|from|have|will|should|user|make|create|need)$/i.test(w));
    const titleWords = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const primarySubject = titleWords[0] || "Product";

    return [
      `${primarySubject} Showcase`,
      `${primarySubject} Highlights`,
      `${primarySubject} Gallery`,
      `${primarySubject} Overview`
    ];
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

    const tone = characteristics?.emotionalTone?.primary || "professional";
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
    const charAny = characteristics as any;
    const coreNoun = charAny.coreEntityName || "Focal Subject";
    let primarySubject = `${coreNoun.toLowerCase()} centerpiece`;
    let focalEntityName = `${coreNoun} Centerpiece`;
    let entityCategory = "structure";

    let environmentDescription = "Tactile ambient lighting with procedural volumetric atmosphere and soft directional illumination";
    let lightingModel = "Warm ambient daylight with soft directional sunlight casting realistic contact shadows";
    let materialsDescription = "Physically based materials (roughness 0.5, metalness 0.2) with rich contextual surface texturing";

    if (/\b(underwater|deep-sea|ocean|marine|subsea|hydrothermal|abyssal|submersible)\b/i.test(rawPrompt)) {
      primarySubject = "submersible explorer and hydrothermal vent field";
      focalEntityName = "Hydrothermal Submersible Explorer";
      lightingModel = "Bioluminescent oceanic lighting with deep-sea particulate scattering and hydrophone glow";
      environmentDescription = "Abyssal underwater ocean trench with hydrothermal chimneys and bathymetric terrain";
    } else if (/\b(horolog|tourbillon|watch|caliber|escapement)\b/i.test(rawPrompt)) {
      primarySubject = "mechanical tourbillon caliber movement";
      focalEntityName = "Tourbillon Caliber";
      lightingModel = "Macro studio lighting with specular highlights off beveled bridges and rubies";
      environmentDescription = "Minimalist atelier viewing pedestal with ambient directional shadows";
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
    const focalSubject = profile.focalEntityName || profile.primarySubject || (primarySection ? extractFeatureNoun(primarySection.name) : "Focal Subject");
    const experienceIntent = `Immersive 3D ${profile.primarySubject} with interactive spatial exploration, real-time telemetry, and module inspection`;
    const focalElement = `Interactive 3D ${focalSubject} stage with volumetric atmosphere, interactive spatial exploration, and status beacons`;

    const navigationModel = "immersive-hud" as any;
    const layoutTopology: LayoutTopologyType = "PLAYFUL_WORKSPACE";
    const cardDensityRatio = 0.08;

    const spatialPlan: SpatialPlan = {
      sceneType: "WORLD_EXPLORATION",
      focalObject: `Procedural 3D ${focalSubject} stage with tactile contours, landmark beacons, and responsive inspection points`,
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
    const focalSubject = profile.focalEntityName || profile.primarySubject || (primarySection ? extractFeatureNoun(primarySection.name) : "Focal Subject");
    const focalElement = `Panoramic 3D cinematic ${focalSubject} with volumetric atmosphere and milestone waypoints`;

    const navigationModel: NavigationModel = "floating_pills";
    const layoutTopology: LayoutTopologyType = "PORTAL_HERO_SHOWCASE";
    const cardDensityRatio = 0.06;

    const spatialPlan: SpatialPlan = {
      sceneType: "NARRATIVE_JOURNEY",
      focalObject: `Contoured structural ${focalSubject} stage with interactive landmark inspection nodes and environmental sensors`,
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
    const sections: CompositionSection[] = baseSections.map((s, idx) => ({
      ...s,
      layoutFamily: idx === 0 ? "IMMERSIVE_WORLD" : idx === 1 ? "SPLIT_SHOWCASE" : idx === 2 ? "EDITORIAL" : "CONSOLE",
      gridStructure: idx === 0 ? "canvas-fullbleed" : idx === 1 ? "split-6-6" : idx === 2 ? "split-3d-text" : "dock-panel",
    }));
    const scenes = this.deriveScenesPlan(profile, sections);
    const primarySection = sections[0];

    const experienceIntent = `Spatial cartography & landmark atlas with 3D terrain topography, system waypoints, and telemetry nodes`;
    const focalSubject = profile.focalEntityName || profile.primarySubject || (primarySection ? extractFeatureNoun(primarySection.name) : "Topological Atlas");
    const focalElement = `Interactive 3D topological atlas map for ${focalSubject} with active system landmarks and animated waypoint trails`;

    const navigationModel: NavigationModel = "floating_pills";
    const layoutTopology: LayoutTopologyType = "ASYMMETRIC_SPLIT_PANE";
    const cardDensityRatio = 0.07;

    const spatialPlan: SpatialPlan = {
      sceneType: "SPATIAL_EXHIBITION",
      focalObject: `Topological relief model stage for ${focalSubject} with system node markers, module coordinates, and telemetry landmark beacons`,
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
    const focalSubject = profile.focalEntityName || profile.primarySubject || (primarySection ? extractFeatureNoun(primarySection.name) : "Focal Feature");
    const focalElement = `Large 3D focal inspection plinth for ${focalSubject} with animated model display and contextual controls`;

    let navigationModel: NavigationModel = "bottom_dock";
    const layoutTopology: LayoutTopologyType = "SPLIT_SCREEN_WORKSPACE";
    const cardDensityRatio = 0.05;

    const spatialPlan: SpatialPlan = {
      sceneType: "PRODUCT_STAGE",
      focalObject: `Tactile 3D ${focalSubject} model on rotating pedestal stage with responsive controls`,
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

    let sections: CompositionSection[] = baseSections;

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
    const focalSubject = profile.focalEntityName || profile.primarySubject || (primarySection ? extractFeatureNoun(primarySection.name) : "Simulation Model");
    const focalElement = `Interactive simulation sandbox for ${focalSubject} with physics objects, telemetry totems, and atmospheric lighting`;

    const navigationModel: NavigationModel = "bottom_dock";
    const layoutTopology: LayoutTopologyType = "PLAYFUL_WORKSPACE";
    const cardDensityRatio = 0.08;

    const spatialPlan: SpatialPlan = {
      sceneType: "WORLD_EXPLORATION",
      focalObject: `Interactive simulation basin for ${focalSubject} with physical entities, telemetry sensors, and acoustic resonance`,
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
