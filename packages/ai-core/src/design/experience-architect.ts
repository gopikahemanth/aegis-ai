/**
 * ExperienceArchitect
 *
 * Core engine responsible for generating custom UI and spatial composition architectures
 * tailored to the specific product, audience, and intent.
 *
 * SYSTEM INVARIANT:
 * "Aegis may reuse implementation primitives, but a fresh generation must never reuse a
 * page-level design template or composition unless the active ProductExperiencePlan
 * independently derives the same composition from the current prompt."
 */

import { ProductUnderstanding, type ProductCharacteristics } from "./product-understanding.js";
import {
  ExperienceCapabilityResolver,
  type ExperienceCapabilityPlan,
  type ExperienceType,
} from "./experience-capability-plan.js";
import { CandidateCompositionSynthesizer } from "./candidate-composition-synthesizer.js";
import { PromptConstraints } from "../governance/prompt-constraints.js";
import type {
  CompositionGraph,
  CompositionLayer,
  CompositionScene,
  CompositionSection,
  CompositionTransition,
  LayoutTopologyType,
  MotionPlan,
  SpatialPlan,
  UXIntentType,
} from "./composition-graph.js";

export class ExperienceArchitect {
  /**
   * High-level entrypoint for designing a composition graph directly from an options object.
   */
  public static designComposition(options: {
    prompt: string;
    productTitle?: string;
    primaryActivity?: string;
    experienceType?: string;
    real3dRequired?: boolean;
    domainContract?: any;
    characteristics?: ProductCharacteristics;
    generationSeed?: number;
    compositionStrategy?: string;
  }): CompositionGraph {
    const characteristics = options.characteristics || ProductUnderstanding.analyze(options.prompt);
    const capabilityPlan = ExperienceCapabilityResolver.resolve(options.prompt);
    if (options.real3dRequired !== undefined) {
      capabilityPlan.real3dRequired = options.real3dRequired;
    }
    if (options.experienceType) {
      capabilityPlan.experienceType = options.experienceType as any;
    }
    return this.architect(
      options.prompt,
      characteristics,
      capabilityPlan,
      options.domainContract,
      options.generationSeed,
      options.compositionStrategy
    );
  }

  /**
   * Regenerates a divergent composition graph when the user explicitly rejects
   * a design or requests a completely different layout topology.
   */
  public static regenerateDivergent(
    previousGraph: CompositionGraph,
    options: {
      prompt: string;
      productTitle?: string;
      primaryActivity?: string;
      domainContract?: any;
      generationSeed?: number;
    }
  ): CompositionGraph {
    const characteristics = ProductUnderstanding.analyze(options.prompt);
    const capabilityPlan = ExperienceCapabilityResolver.resolve(options.prompt);
    const graph = this.architect(options.prompt, characteristics, capabilityPlan, options.domainContract, options.generationSeed);

    const altTopology: LayoutTopologyType = previousGraph.layoutTopology === "VISUAL_ANALYTICS_CANVAS"
      ? "SPLIT_SCREEN_WORKSPACE"
      : previousGraph.layoutTopology === "EDITORIAL_LANDING"
      ? "PORTAL_HERO_SHOWCASE"
      : previousGraph.layoutTopology === "PORTAL_HERO_SHOWCASE"
      ? "ASYMMETRIC_SPLIT_PANE"
      : "OPERATIONAL_COMMAND_CONSOLE";

    graph.layoutTopology = altTopology;
    graph.structuralFingerprint = `DIVERGENT:${altTopology}:${graph.navigationModel}:${Date.now()}`;
    return graph;
  }

  /**
   * Generates a tailor-made CompositionGraph from product meaning, emotional intent,
   * capabilities, and domain context.
   */
  public static architect(
    prompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any,
    generationSeed?: number,
    explicitStrategy?: string
  ): CompositionGraph {
    const cleanPrompt = PromptConstraints.stripNegativeConstraints(prompt || "");
    const raw = cleanPrompt.toLowerCase();

    // 1. If 3D / WebGL is required or requested, design a spatial composition
    if (capabilityPlan.real3dRequired || capabilityPlan.experienceType === "IMMERSIVE_3D" || capabilityPlan.experienceType === "WEBGL_EXPERIENCE") {
      return this.designSpatialComposition(raw, characteristics, capabilityPlan, domainContract, generationSeed, explicitStrategy);
    }

    // 2. Editorial / Publication / Narrative / Scientific Observatory
    if (capabilityPlan.experienceType === "EDITORIAL" || characteristics.experiencePattern === "craft-editorial" || raw.includes("magazine") || raw.includes("journalism") || raw.includes("essay") || raw.includes("publication") || raw.includes("monograph") || raw.includes("observatory") || raw.includes("astronomy")) {
      return this.designEditorialComposition(raw, characteristics, capabilityPlan, domainContract);
    }

    // 3. Storefront / Retail / Food / Marketplace
    if (capabilityPlan.experienceType === "COMMERCE" || characteristics.experiencePattern === "storefront-commerce" || raw.includes("bakery") || raw.includes("boutique") || raw.includes("store") || raw.includes("shop")) {
      return this.designStorefrontComposition(raw, characteristics, capabilityPlan, domainContract);
    }

    // 4. Luxury Hospitality / Sanctuary / Resort
    if (!PromptConstraints.isForbiddenByPrompt(prompt, "hotel") && !PromptConstraints.isForbiddenByPrompt(prompt, "hospitality") &&
        (characteristics.experiencePattern === "hospitality-portal" || raw.includes("resort") || raw.includes("hotel") || raw.includes("sanctuary") || raw.includes("villa") || raw.includes("yacht charter"))) {
      return this.designHospitalityComposition(raw, characteristics, capabilityPlan, domainContract);
    }

    // 5. High-Density Telemetry / Realtime Console / Trading
    if (characteristics.experiencePattern === "realtime-console" || raw.includes("telemetry") || raw.includes("sensor") || raw.includes("trading") || raw.includes("inverter") || raw.includes("dispatch")) {
      return this.designConsoleComposition(raw, characteristics, capabilityPlan, domainContract);
    }

    // 6. Personal Companion / Mindful Habit / Plant Care
    if (characteristics.experiencePattern === "personal-tracker" || raw.includes("plant") || raw.includes("habit") || raw.includes("mood") || raw.includes("diary")) {
      return this.designTrackerComposition(raw, characteristics, capabilityPlan, domainContract);
    }

    // 7. Dynamic Experience Composition (Portfolio, Interactive Map, General)
    return this.designDynamicComposition(raw, characteristics, capabilityPlan, domainContract);
  }

  /**
   * Generates a custom 3D spatial composition graph.
   * Crucially differentiates perfume reveal vs. fantasy universe vs. space museum vs. sneaker stage.
   */
  public static designSpatialComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any,
    generationSeed?: number,
    explicitStrategy?: string
  ): CompositionGraph {
    const seedNum = generationSeed !== undefined ? Math.abs(generationSeed) : 0;

    // Dynamically derive valid candidate architectures from product semantics & capabilities
    const candidates = CandidateCompositionSynthesizer.generateCandidates({
      prompt: rawPrompt,
      characteristics,
      capabilityPlan,
      domainContract,
      generationSeed: seedNum,
    });

    let selected = candidates[seedNum % candidates.length];
    if (explicitStrategy) {
      const match = candidates.find(c => c.strategyId === explicitStrategy);
      if (match) selected = match;
    }

    const spatialPlan = selected.spatialPlan!;
    const scenes = selected.scenes;
    const sections = selected.sections;
    const layers = selected.layers;
    const navigationModel = selected.navigationModel;
    const experienceIntent = selected.experienceIntent;
    const focalElement = selected.focalElement;
    const layoutTopology = selected.layoutTopology;
    const cardDensityRatio = selected.cardDensityRatio;
    const selectedStrategy = selected.strategyId;

    const motionPlan: MotionPlan = {
      motionLanguage: rawPrompt.includes("playful") || rawPrompt.includes("whimsical") ? "playful" : rawPrompt.includes("luxury") ? "gentle" : "snappy",
      transitionStrategy: "Continuous scroll-linked 3D camera dolly and smooth interpolation",
      scrollCoupling: "tight_dolly",
      easingCurve: "cubic-bezier(0.25, 1, 0.5, 1)",
    };

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `SPATIAL_3D:${selectedStrategy}:${spatialPlan.sceneType}:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}:seed_${seedNum.toString(16)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology,
      compositionStrategy: selectedStrategy,
      generationSeed: seedNum,
      spatialPlan,
      motionPlan,
      navigationModel,
      interactionModel: spatialPlan.interactionTopology,
      layers,
      scenes,
      transitions: scenes.slice(0, -1).map((s, idx) => ({
        fromSceneId: s.id,
        toSceneId: scenes[idx + 1].id,
        trigger: "scroll",
        animationType: "camera_orbit",
        durationMs: 800,
      })),
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "Navbar -> Hero -> Cards -> Cards -> CTA -> Footer",
        "HeroTemplate",
        "GenericCardGrid",
        "DashboardTemplate",
        "Flat2DCardDowngrade",
      ],
      intent: selected.intent as any,
      topology: selected.topology as any,
      primaryFocus: selected.primaryFocus as any,
      widgets: selected.widgets || [],
      interactions: selected.interactions || [],
      responsiveStrategy: selected.responsiveStrategy as any,
    };
  }

  /**
   * Generates an editorial / publication composition graph (minimalist, typography-first, asymmetric).
   */
  public static designEditorialComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const experienceIntent = "Longform typographic editorial monograph with asymmetric split layouts and photo essays";
    const focalElement = "Oversized dramatic serif headline with author monograph, pull-quote, and reading time indicator";
    const navigationModel = "minimal-top-masthead";
    const cardDensityRatio = 0.12;

    const sections: CompositionSection[] = [
      {
        id: "sec_cover",
        order: 1,
        name: "Editorial Monograph Cover",
        focalElement: "Dramatic serif headline, publication volume, and lead essay monograph",
        layoutFamily: "EDITORIAL",
        gridStructure: "asymmetric-editorial",
        contentPurpose: "Immersive typographic opening to the publication",
        primaryAction: { label: "Begin Reading Monograph", action: "scroll_reading" },
        secondaryElements: ["Reading time", "Issue number", "Author credentials"],
      },
      {
        id: "sec_photo_essay",
        order: 2,
        name: "Visual Photo Essay & Pull-Quote Split",
        focalElement: "Full-height archival duotone photography paired with large pull-quote",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-5-7",
        contentPurpose: "Highlight central aesthetic and conceptual thesis",
        secondaryElements: ["Curatorial caption", "Archival provenance"],
      },
      {
        id: "sec_narrative_body",
        order: 3,
        name: "In-Depth Analytical Narrative & Marginalia",
        focalElement: "High-contrast multi-column narrative body with marginal citations",
        layoutFamily: "EDITORIAL",
        gridStructure: "prose-with-marginalia",
        contentPurpose: "Deep scholarly or narrative exploration",
        secondaryElements: ["Footnotes", "Historical timeline sidebar"],
      },
      {
        id: "sec_archive",
        order: 4,
        name: "Curated Archival Folio",
        focalElement: "Horizontal sliding reel of related monographs and essays",
        layoutFamily: "GRID_CATALOG",
        gridStructure: "horizontal-folio",
        contentPurpose: "Explore related publications",
        primaryAction: { label: "Browse Entire Archive", action: "open_archive" },
        secondaryElements: ["Filter by era", "Curator notes"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `EDITORIAL:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "EDITORIAL_LANDING",
      navigationModel,
      interactionModel: "scroll-driven-storytelling",
      layers: [
        { id: "l_bg", name: "Paper Texture Surface", depth: "background", renderingTechnology: "dom", contentRole: "Background", description: "Warm ivory textured surface" },
        { id: "l_content", name: "Typographic Narrative", depth: "foreground", renderingTechnology: "dom", contentRole: "Editorial Content", description: "High-contrast editorial typography" },
      ],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "Hero -> Cards -> Cards -> CTA",
        "GenericCardGrid",
        "GenericSaaSBlue",
        "AdminDashboardTable",
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
        entity: "EditorialMonograph",
        title: "Curated Literary Monograph",
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [
        { id: "w_lead", type: "editorial_lead", title: "Publication Cover", regionId: "cover" },
      ],
      interactions: [
        { trigger: "click", target: "Read Monograph", action: "navigate", description: "Scroll into essay body" },
      ],
      responsiveStrategy: {
        desktop: "split-5-7",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Generates a retail / storefront composition graph (continuous scroll, product reveal, cart drawer).
   */
  public static designStorefrontComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const isBakery = rawPrompt.includes("bakery") || rawPrompt.includes("bread") || rawPrompt.includes("pastry");
    const isBookstore = rawPrompt.includes("bookstore") || rawPrompt.includes("bookseller") || rawPrompt.includes("book shop") ||
      (rawPrompt.includes("book") && (rawPrompt.includes("catalog") || rawPrompt.includes("cart") || rawPrompt.includes("author") || rawPrompt.includes("reading") || rawPrompt.includes("petal")));
    const experienceIntent = isBakery
      ? "Artisan bakery storefront with daily fresh bake schedule, sourdough catalog, and cart bag"
      : isBookstore
      ? "Curated independent bookstore with literature catalog, staff selections, signed first editions, and shopping bag"
      : "Continuous retail storefront with category exploration, curated product grid, and sliding cart drawer";
    const focalElement = isBakery
      ? "Warm artisanal hero with freshly baked morning bread highlights and oven batch countdown"
      : isBookstore
      ? "Warm editorial bookstore masthead showcasing featured staff selections, signed edition lotteries, and botanical pairings"
      : "Editorial retail storefront banner with category pills and promotional product carousel";
    const navigationModel = "top-nav-cart";
    const cardDensityRatio = 0.55;

    const sections: CompositionSection[] = [
      {
        id: "sec_hero",
        order: 1,
        name: isBakery ? "Hearth & Fresh Bake Hero" : isBookstore ? "Curated Reading & Literary Masthead" : "Storefront Showcase Banner",
        focalElement,
        layoutFamily: "STOREFRONT",
        gridStructure: "full-width-banner",
        contentPurpose: "Brand introduction and immediate catalog entry point",
        primaryAction: { label: isBakery ? "Explore Today's Bakes" : isBookstore ? "Browse Book Catalog" : "Shop Collection", action: "scroll_catalog" },
        secondaryElements: [isBakery ? "6 AM Fresh Batch Badge" : isBookstore ? "Complimentary Bookmarks & Tote Over $40" : "Free Shipping Over $50", "Cart Icon with live badge"],
      },
      {
        id: "sec_categories",
        order: 2,
        name: isBookstore ? "Literary Genre & Category Rail" : "Departmental Category Rail",
        focalElement: "Interactive horizontal filter pills with category icons",
        layoutFamily: "STOREFRONT",
        gridStructure: "horizontal-pill-row",
        contentPurpose: isBookstore ? "Quick-filter books by literary genre or format" : "Quick-filter catalog by department or bake type",
        secondaryElements: ["Active filter count", "Clear filters button"],
      },
      {
        id: "sec_catalog",
        order: 3,
        name: isBakery ? "Daily Oven Catalog & Loaves Grid" : isBookstore ? "Curated Book Catalog & Cover Gallery" : "Curated Product Grid",
        focalElement: "Responsive grid of authentic domain product cards with instant Add to Cart action",
        layoutFamily: "GRID_CATALOG",
        gridStructure: "grid-4-col",
        contentPurpose: "Browse and add items to purchase bag",
        primaryAction: { label: isBookstore ? "Add to Bag" : "Add to Bag", action: "add_to_cart" },
        secondaryElements: ["Price display", "Inventory status", isBookstore ? "Format & Staff Pick badges" : "Dietary/material badges"],
      },
      {
        id: "sec_custom_order",
        order: 4,
        name: isBakery ? "Custom Cake & Celebration Builder" : isBookstore ? "Staff Picks & Author Salons" : "Featured Spotlight Story",
        focalElement: isBakery ? "Interactive cake builder with flavor, size, and inscription selectors" : isBookstore ? "Curated staff recommendations and signed author salon tickets" : "Artisan provenance story",
        layoutFamily: isBakery ? "FORM_CENTRIC" : "EDITORIAL",
        gridStructure: "split-customizer",
        contentPurpose: isBakery ? "Order personalized celebration bake" : isBookstore ? "Staff recommendations and signed edition drops" : "Brand story and material lineage",
        primaryAction: { label: isBakery ? "Add Custom Cake to Bag" : isBookstore ? "Explore Salons" : "Learn More", action: "submit_custom" },
        secondaryElements: [isBookstore ? "Curator's Note" : "Dynamic price estimator", isBookstore ? "Rare Signed Copy Vault" : "Lead-time badge"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `STOREFRONT:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "PORTAL_HERO_SHOWCASE",
      navigationModel,
      interactionModel: "direct_manipulation",
      layers: [],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "Hero -> Cards -> Cards -> CTA",
        "DashboardTemplate",
        "AdminDashboardTable",
        "TabbedEngineConsole",
        "TelemetryGauges",
      ],
      intent: "TRANSACT_BROWSE",
      topology: {
        type: "PORTAL_HERO_SHOWCASE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "catalog", role: "primary", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "cart_drawer", role: "aside", gridSpan: { cols: 4 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "catalog_grid",
        entity: isBakery ? "ArtisanBake" : "ProductItem",
        title: "Product Catalog",
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [
        { id: "w_cart", type: "cart_drawer", title: "Slide-out Cart Bag", regionId: "cart_drawer" },
      ],
      interactions: [
        { trigger: "click", target: "Add to Bag", action: "mutate_record", description: "Increments cart item count" },
        { trigger: "click", target: "Cart Icon", action: "open_modal", description: "Opens slide-out cart drawer" },
      ],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-2-col",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Generates a luxury hospitality / resort composition graph.
   */
  public static designHospitalityComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const experienceIntent = "Ultra-luxury sanctuary portal with suite availability matrix, experiential excursions, and concierge booking";
    const focalElement = "Full-bleed coastal sanctuary hero with integrated arrival/departure date & guest reservation bar";
    const navigationModel = "floating-pill";
    const cardDensityRatio = 0.32;

    const sections: CompositionSection[] = [
      {
        id: "sec_sanctuary_hero",
        order: 1,
        name: "Sanctuary Hero & Date Booking Bar",
        focalElement,
        layoutFamily: "HOSPITALITY_PORTAL",
        gridStructure: "hero-with-booking-bar",
        contentPurpose: "Establish luxury ambiance and capture reservation intent immediately",
        primaryAction: { label: "Check Availability", action: "check_dates" },
        secondaryElements: ["Arrival date picker", "Departure date picker", "Guest count selector"],
      },
      {
        id: "sec_villas",
        order: 2,
        name: "Private Villas & Suites Showcase",
        focalElement: "Curated collection of luxury pavilions with floorplans, private pools, and nightly pricing",
        layoutFamily: "GRID_CATALOG",
        gridStructure: "grid-3-col",
        contentPurpose: "Browse and select accommodations",
        primaryAction: { label: "Reserve Villa", action: "open_villa_modal" },
        secondaryElements: ["Ocean view badge", "Nightly rate", "Floorplan download"],
      },
      {
        id: "sec_dining",
        order: 3,
        name: "Fine Dining Venues & Table Booking",
        focalElement: "Epicurean restaurant preview with chef profiles, menus, and table reservation",
        layoutFamily: "EDITORIAL",
        gridStructure: "split-5-7",
        contentPurpose: "Reserve private dining and tasting menus",
        primaryAction: { label: "Reserve Table", action: "open_dining_modal" },
        secondaryElements: ["Sommelier selection", "Tasting menu preview"],
      },
      {
        id: "sec_concierge",
        order: 4,
        name: "Private Excursions & Concierge Intake",
        focalElement: "Yacht charters, marine reserve diving, and wellness spa treatments",
        layoutFamily: "GRID_CATALOG",
        gridStructure: "grid-2-col",
        contentPurpose: "Curate tailored guest itinerary",
        secondaryElements: ["Excursion duration", "Private guide badge"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `HOSPITALITY:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "PORTAL_HERO_SHOWCASE",
      navigationModel,
      interactionModel: "reservation_flow",
      layers: [],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "AdminCRUDTable",
        "TechnicalTelemetryGauges",
        "TabbedConsoleEngine",
      ],
      intent: "TRANSACT_BROWSE",
      topology: {
        type: "PORTAL_HERO_SHOWCASE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "suites", role: "primary", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "experiences", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
        ],
      },
      primaryFocus: {
        type: "availability_matrix",
        entity: "SanctuaryVilla",
        title: "Villa Suites Availability Matrix",
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [
        { id: "w_booking_bar", type: "booking_bar", title: "Reservation Date Engine", regionId: "hero" },
      ],
      interactions: [
        { trigger: "click", target: "Reserve Villa", action: "open_modal", description: "Opens villa reservation modal" },
      ],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-2-col",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Generates a high-density operations or telemetry console composition graph.
   */
  public static designConsoleComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const isSolar = rawPrompt.includes("solar") || rawPrompt.includes("inverter") || rawPrompt.includes("photovoltaic");
    const experienceIntent = isSolar
      ? "Real-time high-density solar inverter telemetry, power aggregation, and operational setpoint control"
      : "High-density real-time operational telemetry, signal matrix, and dispatch control console";
    const focalElement = "Telemetry banner with live system status, critical threshold alerts, and multi-channel metrics";
    const navigationModel = "command-console";
    const cardDensityRatio = 0.4;

    const sections: CompositionSection[] = [
      {
        id: "sec_telemetry_header",
        order: 1,
        name: "Telemetry Status & Alert Banner",
        focalElement,
        layoutFamily: "CONSOLE",
        gridStructure: "dense-metric-strip",
        contentPurpose: "Immediate operational status and anomaly alerts",
        primaryAction: { label: "Acknowledge Alerts", action: "ack_alerts" },
        secondaryElements: ["System uptime", "Active fault count", "Network ping"],
      },
      {
        id: "sec_grid",
        order: 2,
        name: isSolar ? "Solar Inverter Power Grid" : "Operational Signal Matrix",
        focalElement: "Dense real-time grid of monitored units with voltage, current, and temperature telemetry",
        layoutFamily: "CONSOLE",
        gridStructure: "grid-table-hybrid",
        contentPurpose: "Inspect state across all monitored channels or inverters",
        primaryAction: { label: "Calibrate Thresholds", action: "open_calibration" },
        secondaryElements: ["Channel filtering", "Sort by variance", "CSV export"],
      },
      {
        id: "sec_chart",
        order: 3,
        name: "Multi-Channel Waveform & Time-Series Chart",
        focalElement: "Synchronized multi-axis time-series visualization with threshold reference bands",
        layoutFamily: "CONSOLE",
        gridStructure: "chart-full-width",
        contentPurpose: "Historical and real-time trend analysis",
        secondaryElements: ["Time range picker (1h, 24h, 7d)", "Legend toggle"],
      },
      {
        id: "sec_log",
        order: 4,
        name: "Operational Event Log & Override Console",
        focalElement: "Chronological event ledger with manual override action buttons",
        layoutFamily: "TIMELINE",
        gridStructure: "split-console-log",
        contentPurpose: "Audit past events and trigger emergency cutoffs",
        primaryAction: { label: "Emergency Cutoff Override", action: "trigger_override" },
        secondaryElements: ["Filter by severity", "Technician sign-off"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `CONSOLE:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "OPERATIONAL_COMMAND_CONSOLE",
      navigationModel,
      interactionModel: "telemetry_command",
      layers: [],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "PlayfulIllustration",
        "AiryWhitespace",
        "HeroCTAButtons",
      ],
      intent: "MONITOR_CONTROL",
      topology: {
        type: "OPERATIONAL_COMMAND_CONSOLE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "compact" },
          { id: "matrix", role: "primary", gridSpan: { cols: 12 }, density: "compact" },
          { id: "events", role: "secondary", gridSpan: { cols: 12 }, density: "compact" },
        ],
      },
      primaryFocus: {
        type: "telemetry_grid",
        entity: isSolar ? "SolarInverter" : "TelemetryUnit",
        title: "Live Telemetry Grid",
        description: experienceIntent,
        density: "compact",
      },
      widgets: [
        { id: "w_ticker", type: "telemetry_ticker", title: "Live Signal Ticker", regionId: "hero" },
      ],
      interactions: [
        { trigger: "click", target: "Acknowledge Alert", action: "mutate_record", description: "Dismisses active alert" },
      ],
      responsiveStrategy: {
        desktop: "command-console-3",
        tablet: "stack-vertical-split",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Generates a personal tracker or mindful companion composition graph.
   */
  public static designTrackerComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const isPlant = rawPrompt.includes("plant") || rawPrompt.includes("botanical") || rawPrompt.includes("houseplant");
    const experienceIntent = isPlant
      ? "Cozy botanical companion app with plant shelf, soil moisture tracking, and watering schedule streak"
      : "Mindful personal habit companion with daily check-in, streak progress, and reflection timeline";
    const focalElement = isPlant
      ? "Cozy Plant Sanctuary shelf with moisture saturation dials, sunlight indicators, and prominent 'Water Today' button"
      : "Personal habit check-in card with daily goal progress ring and streak milestone celebration";
    const navigationModel = "bottom-tab";
    const cardDensityRatio = 0.28;

    const sections: CompositionSection[] = [
      {
        id: "sec_today",
        order: 1,
        name: isPlant ? "Plant Sanctuary Shelf" : "Daily Check-in & Habit Core",
        focalElement,
        layoutFamily: "TRACKER",
        gridStructure: "cozy-shelf",
        contentPurpose: "The single daily action touched by the user every day",
        primaryAction: { label: isPlant ? "Water Green Companion" : "Complete Today", action: "log_action" },
        secondaryElements: [isPlant ? "12-day care streak" : "Current streak", "Next hydration due"],
      },
      {
        id: "sec_schedule",
        order: 2,
        name: isPlant ? "Room-by-Room Hydration Checklist" : "Weekly Habit Calendar",
        focalElement: "Interactive checklist grouped by location or category with quick-complete toggles",
        layoutFamily: "FORM_CENTRIC",
        gridStructure: "checklist-grouped",
        contentPurpose: "Review and complete pending items",
        secondaryElements: ["Due date indicator", "Snooze reminder"],
      },
      {
        id: "sec_history",
        order: 3,
        name: isPlant ? "Growth Timeline & Photo Journal" : "Reflection Journal & Milestones",
        focalElement: "Chronological feed of growth photos, notes, and milestone badges",
        layoutFamily: "TIMELINE",
        gridStructure: "timeline-feed",
        contentPurpose: "Celebrate growth and review historical progress",
        primaryAction: { label: isPlant ? "+ Add Growth Photo" : "+ New Reflection", action: "open_log" },
        secondaryElements: ["Badge collection", "Month-over-month comparison"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `TRACKER:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "PLAYFUL_WORKSPACE",
      navigationModel,
      interactionModel: "direct_manipulation",
      layers: [],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "GenericSaaSBlue",
        "CorporateTable",
        "DenseTelemetryMatrix",
      ],
      intent: "CREATE_AUTHOR",
      topology: {
        type: "PLAYFUL_WORKSPACE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
          { id: "checklist", role: "primary", gridSpan: { cols: 12 }, density: "balanced" },
          { id: "timeline", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
        ],
      },
      primaryFocus: {
        type: "document_workspace",
        entity: isPlant ? "Houseplant" : "HabitGoal",
        title: "Daily Companion Workspace",
        description: experienceIntent,
        density: "spacious",
      },
      widgets: [
        { id: "w_streak", type: "streak_badge", title: "Care Streak", regionId: "hero" },
      ],
      interactions: [
        { trigger: "click", target: "Water Plant", action: "mutate_record", description: "Records hydration and increments streak" },
      ],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-2-col",
        mobile: "bottom-sheet-nav",
      },
    };
  }

  /**
   * Generates a dynamic, prompt-specific composition graph for unclassified domains.
   */
  public static designDynamicComposition(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    domainContract?: any
  ): CompositionGraph {
    const primaryObject = (domainContract?.entities && domainContract.entities[0])
      ? (typeof domainContract.entities[0] === 'string' ? domainContract.entities[0] : domainContract.entities[0].name)
      : (characteristics.vocabularyContract?.required?.[0] || "Item");

    const experienceIntent = `Tailored application architecture designed for ${characteristics.experiencePattern}`;
    const focalElement = `Interactive primary workspace designed specifically for ${primaryObject}`;
    const navigationModel = characteristics.informationDensity === "dense" ? "command-console" : "top-pill";
    const cardDensityRatio = 0.3;

    const sections: CompositionSection[] = [
      {
        id: "sec_main",
        order: 1,
        name: `${primaryObject} Workspace`,
        focalElement,
        layoutFamily: "HERO_FIRST",
        gridStructure: "adaptive-grid",
        contentPurpose: `Primary interaction for managing ${primaryObject}`,
        primaryAction: { label: `+ Create ${primaryObject}`, action: "create_record" },
        secondaryElements: ["Quick filter", "Active count"],
      },
      {
        id: "sec_detail",
        order: 2,
        name: "Activity & State Ledger",
        focalElement: "Real-time state and history timeline",
        layoutFamily: "TIMELINE",
        gridStructure: "split-timeline",
        contentPurpose: "Inspect past history and record updates",
        secondaryElements: ["Date range", "Status filter"],
      },
    ];

    const sectionNames = sections.map(s => s.name);
    const structuralFingerprint = `DYNAMIC:${navigationModel}:${focalElement.slice(0, 30)}:${sectionNames.join("->")}:${cardDensityRatio.toFixed(2)}`;

    return {
      experienceIntent,
      focalElement,
      layoutTopology: "PORTAL_HERO_SHOWCASE",
      navigationModel,
      interactionModel: "general_operations",
      layers: [],
      scenes: [],
      transitions: [],
      sections,
      cardDensityRatio,
      structuralFingerprint,
      forbiddenTemplates: [
        "Navbar -> Hero -> Cards -> Cards -> CTA -> Footer",
        "HeroTemplate",
      ],
      intent: "INSPECT_MANAGE",
      topology: {
        type: "PORTAL_HERO_SHOWCASE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "balanced" },
          { id: "primary", role: "primary", gridSpan: { cols: 12 }, density: "balanced" },
        ],
      },
      primaryFocus: {
        type: "document_workspace",
        entity: primaryObject,
        title: `${primaryObject} Workspace`,
        description: experienceIntent,
        density: "balanced",
      },
      widgets: [],
      interactions: [
        { trigger: "click", target: "Primary Action", action: "open_modal", description: "Opens creation intake" },
      ],
      responsiveStrategy: {
        desktop: "grid-12-col",
        tablet: "grid-2-col",
        mobile: "single-column-flow",
      },
    };
  }
}
