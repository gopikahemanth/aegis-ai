/**
 * WebsiteExperienceIdentity
 *
 * Authoritative first-class design identity governing the entire generated website experience.
 *
 * Unifies:
 * - Navigation Design (consistent within a project, derived independently between projects)
 * - Page Composition Language (asymmetric spreads, spatial scenes, stages — NOT generic card grids)
 * - Typography Language (scale, display/body pairing, pull-quotes, marginalia)
 * - Visual Hierarchy (dominant focal anchor, rhythm, whitespace scale)
 * - Surface & Material Language (tactile shaders, paper & stone, titanium, glass)
 * - Motion Language (cinematic, playful, precise, ambient)
 * - Interaction Language (tactile manipulation, spatial navigation, scrollytelling)
 * - Content Presentation Language (monograph essays, character encounters, caliber loupe)
 * - Spatial Treatment (Three.js WebGL scene integration)
 * - Transition Language (scene dollies, cross-fades, scroll coupling)
 * - Responsive Strategy (desktop, tablet, mobile)
 */

import { NavigationDesignResolver, type NavigationDesign } from "./navigation-design.js";
import type { ProductCharacteristics } from "./product-understanding.js";
import type { ExperienceCapabilityPlan } from "./experience-capability-plan.js";

export type ExperienceGenre =
  | "SPATIAL_WORLD"
  | "LUXURY_ARTIFACT_STAGE"
  | "EDITORIAL_PUBLICATION"
  | "HIGH_DENSITY_CONSOLE"
  | "SENSORY_COMMERCE"
  | "MINDFUL_COMPANION"
  | "DYNAMIC_BESPOKE";

export interface PageCompositionRule {
  route: string;
  pageRole: string;
  dominantStructure:
    | "FULL_BLEED_STAGE"
    | "EDITORIAL_SPREAD"
    | "SCROLL_VISUAL_ESSAY"
    | "ASYMMETRIC_TECTONIC_STUDY"
    | "SPATIAL_LORE_MAP"
    | "TACTILE_AUDIO_SURFACE"
    | "CHARACTER_ENCOUNTER_CAROUSEL"
    | "METALLURGY_COMPARISON_STAGE"
    | "CONCIERGE_SALON"
    | "DENSE_TELEMETRY_GRID"
    | "CURATED_COLLECTION_SHOWCASE"
    | "BESPOKE_CANVAS";
  primaryFocalElement: string;
  bannedPatterns: string[];
  allowedComponents: string[];
  layoutDescription: string;
}

export interface WebsiteExperienceIdentity {
  id: string;
  genre: ExperienceGenre;
  brandIdentity: {
    name: string;
    tagline?: string;
    essence: string;
    tone: string;
    voice: string;
  };
  navigationDesign: NavigationDesign;
  pageCompositionLanguage: {
    layoutFamily: string;
    rhythm: "spacious-monograph" | "cinematic-stage" | "tactile-playful" | "dense-scientific" | "calm-ambient";
    gridSystem: string;
    heroPhilosophy: string;
    asymmetricSpreadsAllowed: boolean;
    fullBleedMediaAllowed: boolean;
    cardProhibitionReason?: string;
    pageCompositionRules: PageCompositionRule[];
  };
  typographyLanguage: {
    displayFont: string;
    bodyFont: string;
    scale: "heroic-editorial" | "refined-luxury" | "playful-geometric" | "technical-mono" | "balanced";
    uppercaseTracking: boolean;
    pullQuoteStyle?: string;
    marginaliaStyle?: string;
    dropCapAllowed: boolean;
  };
  visualHierarchy: {
    dominantVisualAnchor: string;
    secondaryFoci: string[];
    whitespaceScale: "generous" | "cinematic-fullbleed" | "compact-data";
    contrastModel: "dramatic-chiaroscuro" | "luminous-tactile" | "warm-paper" | "sleek-dark" | "clean-neutral";
  };
  surfaceMaterialLanguage: {
    philosophy: string;
    borderTreatment: string;
    shadowDepth: string;
    backgroundShaderOrTone: string;
    tactileFeedback: string;
  };
  motionLanguage: {
    easingCurve: string;
    transitionSpeed: "snappy" | "smooth-cinematic" | "gentle-languid" | "instant";
    scrollCoupling: "tight_dolly" | "ambient_drift" | "discrete_steps" | "standard_flow";
    enterAnimation: string;
  };
  interactionLanguage: {
    primaryVerb: string;
    explorationStyle: string;
    feedbackType: string;
    stateChangeStyle: string;
  };
  contentPresentationLanguage: {
    presentationFormat: string;
    storyPacing: string;
    mediaArrangement: string;
  };
  spatialTreatment?: {
    focalObject: string;
    sceneRole: string;
    cameraPhilosophy: string;
    domIntegrationStyle: string;
  };
  transitionLanguage: {
    betweenPages: string;
    betweenScenes: string;
    scrollAnchor: string;
  };
  responsiveStrategy: {
    desktopLayout: string;
    tabletLayout: string;
    mobileAdaptation: string;
  };
}

export class WebsiteExperienceIdentityResolver {
  /**
   * Resolves a coherent WebsiteExperienceIdentity from user prompt,
   * product characteristics, and capability requirements.
   */
  public static resolve(
    prompt: string,
    characteristics: ProductCharacteristics,
    capabilityPlan: ExperienceCapabilityPlan,
    navigationDesign: NavigationDesign,
    brief?: any,
    domainContract?: any
  ): WebsiteExperienceIdentity {
    const raw = (prompt || "").toLowerCase();

    // 1. Detect Genre
    const isOperational = /\b(avionics|aerospace|aircraft|flight|aviation|telemetry|scada|radar|defense|satellite|drone|uav|mission control|cockpit|subsystem|firmware|airframe)\b/i.test(raw);
    const isArchPublication =
      !isOperational &&
      !/\b(software architecture|system architecture|data architecture|application architecture|required by the architecture|backend architecture|cloud architecture)\b/i.test(raw) &&
      /\b(architectural\s+(?:monograph|journal|review|digest|firm|studio|practice|portfolio|criticism)|architecture\s+(?:firm|studio|monograph|journal|magazine|exhibition)|building\s+typolog(?:y|ies)|spatial\s+(?:monograph|essay)|tectonic\s+journal)\b/i.test(raw);

    const genre: ExperienceGenre =
      (isOperational || characteristics.experiencePattern === "realtime-console" || raw.includes("telemetry") || raw.includes("sensor") || raw.includes("trading") || raw.includes("scada"))
        ? "HIGH_DENSITY_CONSOLE"
        : (capabilityPlan.real3dRequired || raw.includes("kazzoo") || raw.includes("fantasy") || raw.includes("planetarium") || raw.includes("claymation") || raw.includes("biome"))
        ? "SPATIAL_WORLD"
        : (raw.includes("watch") || raw.includes("horology") || raw.includes("timepiece") || raw.includes("jewelry") || raw.includes("perfume") || raw.includes("flacon") || raw.includes("luxury"))
        ? "LUXURY_ARTIFACT_STAGE"
        : (!isOperational && (capabilityPlan.experienceType === "EDITORIAL" || isArchPublication || raw.includes("journal") || raw.includes("monograph") || raw.includes("magazine") || raw.includes("essay") || raw.includes("tectonic")))
        ? "EDITORIAL_PUBLICATION"
        : (raw.includes("bakery") || raw.includes("boutique") || raw.includes("store") || raw.includes("shop"))
        ? "SENSORY_COMMERCE"
        : (raw.includes("plant") || raw.includes("habit") || raw.includes("mood") || raw.includes("diary"))
        ? "MINDFUL_COMPANION"
        : "DYNAMIC_BESPOKE";

    const extractedPromptBrand = NavigationDesignResolver.extractBrandFromPrompt(raw);
    const brandName =
      extractedPromptBrand ||
      domainContract?.brandName ||
      domainContract?.name ||
      (domainContract?.domainName && !domainContract.domainName.includes("...") && domainContract.domainName.length <= 28 ? domainContract.domainName : undefined) ||
      brief?.brand?.name ||
      navigationDesign.brandTreatment.name ||
      "Aegis Project";
    const brandTagline = domainContract?.tagline || brief?.brand?.tagline || navigationDesign.brandTreatment.tagline || "";

    // 2. Build Specific Identity Components by Genre
    switch (genre) {
      case "SPATIAL_WORLD":
        return this.buildSpatialWorldIdentity(brandName, brandTagline, navigationDesign, raw, domainContract);

      case "LUXURY_ARTIFACT_STAGE":
        return this.buildLuxuryArtifactIdentity(brandName, brandTagline, navigationDesign, raw, domainContract);

      case "EDITORIAL_PUBLICATION":
        return this.buildEditorialPublicationIdentity(brandName, brandTagline, navigationDesign, raw, domainContract);

      case "HIGH_DENSITY_CONSOLE":
        return this.buildConsoleIdentity(brandName, brandTagline, navigationDesign, raw, domainContract);

      default:
        return this.buildDynamicBespokeIdentity(brandName, brandTagline, navigationDesign, raw, domainContract);
    }
  }

  private static buildSpatialWorldIdentity(
    brandName: string,
    brandTagline: string,
    nav: NavigationDesign,
    raw: string,
    contract?: any
  ): WebsiteExperienceIdentity {
    return {
      id: `identity_world_${Date.now()}`,
      genre: "SPATIAL_WORLD",
      brandIdentity: {
        name: brandName,
        tagline: brandTagline || "Living Archipelago & Fantasy World",
        essence: "Interactive whimsical universe rendered with volumetric Three.js terrain, character lore, and acoustic exploration.",
        tone: "whimsical, luminous, tactile, enchanting",
        voice: "curious, friendly, evocative",
      },
      navigationDesign: nav,
      pageCompositionLanguage: {
        layoutFamily: "IMMERSIVE_3D_WORLD",
        rhythm: "cinematic-stage",
        gridSystem: "spatial-overlay-hud",
        heroPhilosophy: "Direct WebGL canvas viewport where the world itself is the primary stage. Minimal floating HUD anchors.",
        asymmetricSpreadsAllowed: true,
        fullBleedMediaAllowed: true,
        cardProhibitionReason: "World exploration must happen in 3D spatial space; 2D generic card walls ruin immersion.",
        pageCompositionRules: [
          {
            route: "/",
            pageRole: "World Stage & Biome Horizon",
            dominantStructure: "FULL_BLEED_STAGE",
            primaryFocalElement: "Three.js WebGL canvas displaying rotating mossy islands and orbiting celestial spheres with raycaster clicks",
            bannedPatterns: ["search bar + filter buttons", "3-column card grid", "stat KPI boxes"],
            allowedComponents: ["WebGLCanvas", "FloatingHudPills", "BiomeSelectorPill", "SoundscapeMiniPlayer"],
            layoutDescription: "Full-bleed interactive 3D WebGL realm with bottom floating waypoint pills.",
          },
          {
            route: "/quest-map",
            pageRole: "Cartographic Quest Ledger",
            dominantStructure: "SPATIAL_LORE_MAP",
            primaryFocalElement: "Topographic illustrated realm scroll with waypoint nodes and active quest milestones",
            bannedPatterns: ["data table", "records grid", "generic search input"],
            allowedComponents: ["CartographicCanvas", "WaypointDrawer", "LoreBadge"],
            layoutDescription: "Interactive fantasy parchment map connecting ancient waypoints with milestone progression.",
          },
          {
            route: "/companions",
            pageRole: "Character Encounters & Creature Lore",
            dominantStructure: "CHARACTER_ENCOUNTER_CAROUSEL",
            primaryFocalElement: "Interactive creature inspection stage with personality bios, chime frequencies, and animated states",
            bannedPatterns: ["CRM profile list", "search/filter card wall"],
            allowedComponents: ["CreatureStage", "PersonalityVibeRadar", "CommuneButton"],
            layoutDescription: "Centered creature encounter plinth with personality voice cues and bond progression.",
          },
          {
            route: "/soundboard",
            pageRole: "Harmonious Realm Chime Pads",
            dominantStructure: "TACTILE_AUDIO_SURFACE",
            primaryFocalElement: "Tactile acoustic pads triggering pentatonic bells, moss rustles, and celestial wind chimes",
            bannedPatterns: ["search bar", "CRUD table"],
            allowedComponents: ["ChimePads", "FrequencyOscillator", "ChordPresetPill"],
            layoutDescription: "Tactile glowing circular chime pads with live audio feedback and harmonic frequency ripples.",
          },
          {
            route: "/journey",
            pageRole: "Archipelago Chronicle & Milestones",
            dominantStructure: "SCROLL_VISUAL_ESSAY",
            primaryFocalElement: "Vertical illustrated narrative timeline with celestial milestones and artifact discoveries",
            bannedPatterns: ["standard card grid", "search bar"],
            allowedComponents: ["ChronicleTimeline", "MilestonePill", "ArtifactViewer"],
            layoutDescription: "Continuous narrative journey scroll with ambient sound accents and relic reveals.",
          },
        ],
      },
      typographyLanguage: {
        displayFont: "Outfit, system-ui, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "playful-geometric",
        uppercaseTracking: false,
        dropCapAllowed: false,
      },
      visualHierarchy: {
        dominantVisualAnchor: "Central 3D WebGL archipelago terrain with floating pastel spheres and ambient particle dust",
        secondaryFoci: ["Floating HUD waypoint pills", "Chime pads", "Companion cards"],
        whitespaceScale: "cinematic-fullbleed",
        contrastModel: "luminous-tactile",
      },
      surfaceMaterialLanguage: {
        philosophy: "Organic moss, sculpted clay, glowing pastel glass, and deep twilight void.",
        borderTreatment: "1px solid rgba(0, 240, 255, 0.25)",
        shadowDepth: "0 20px 40px rgba(0, 240, 255, 0.12)",
        backgroundShaderOrTone: "linear-gradient(180deg, #030a16 0%, #061826 100%)",
        tactileFeedback: "Haptic chime triggers, smooth 3D orbit rotation, particle bursts on click.",
      },
      motionLanguage: {
        easingCurve: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        transitionSpeed: "smooth-cinematic",
        scrollCoupling: "tight_dolly",
        enterAnimation: "fade-scale-up",
      },
      interactionLanguage: {
        primaryVerb: "Commune & Discover",
        explorationStyle: "Spatial raycasting, orbital drag, tactile chime tapping",
        feedbackType: "Web Audio pentatonic tones + luminous glow ripples",
        stateChangeStyle: "Smooth camera focus transitions without page reload",
      },
      contentPresentationLanguage: {
        presentationFormat: "Spatial encounters, lore fragments, and acoustic play",
        storyPacing: "Meditative, unhurried, wonder-filled",
        mediaArrangement: "3D meshes, floating illuminated glyphs, interactive audio triggers",
      },
      spatialTreatment: {
        focalObject: "Floating mossy islands with glowing flora and pastel spheres",
        sceneRole: "The primary living world viewport in which all UI elements float as HUD lenses",
        cameraPhilosophy: "Slow axial orbit responding to mouse position with macro zoom into landmarks",
        domIntegrationStyle: "Perimeter floating glass pills leaving 85% of screen to the 3D canvas",
      },
      transitionLanguage: {
        betweenPages: "Smooth camera dolly with spatial cross-fade",
        betweenScenes: "Orbital rotation to focal landmark",
        scrollAnchor: "Scene-linked scroll progress",
      },
      responsiveStrategy: {
        desktopLayout: "Full-bleed canvas with perimeter floating HUD",
        tabletLayout: "Full-bleed canvas with bottom dock navigation",
        mobileAdaptation: "Touch-orbit canvas with swipeable bottom cards",
      },
    };
  }

  private static buildLuxuryArtifactIdentity(
    brandName: string,
    brandTagline: string,
    nav: NavigationDesign,
    raw: string,
    contract?: any
  ): WebsiteExperienceIdentity {
    return {
      id: `identity_luxury_${Date.now()}`,
      genre: "LUXURY_ARTIFACT_STAGE",
      brandIdentity: {
        name: brandName,
        tagline: brandTagline || "Haute Horlogerie & Independent Atelier",
        essence: "High-precision mechanical artistry showcased through rotatable 3D artifacts, macro caliber loupe, and private viewing salon.",
        tone: "luxurious, understated, meticulous, prestigious",
        voice: "curatorial, authoritative, refined",
      },
      navigationDesign: nav,
      pageCompositionLanguage: {
        layoutFamily: "PRODUCT_STAGE",
        rhythm: "spacious-monograph",
        gridSystem: "single-artifact-stage",
        heroPhilosophy: "Hero presentation plinth with 360-degree interactive rotation, sapphire crystal reflection, and live metallurgy switching.",
        asymmetricSpreadsAllowed: true,
        fullBleedMediaAllowed: true,
        cardProhibitionReason: "Fine watchmaking requires focused artifact contemplation; generic card grids degrade luxury value.",
        pageCompositionRules: [
          {
            route: "/",
            pageRole: "Manufacture Timepiece Stage",
            dominantStructure: "FULL_BLEED_STAGE",
            primaryFocalElement: "Interactive 3D rotatable timepiece case with live titanium / rose gold / platinum material toggle",
            bannedPatterns: ["search bar + filter", "card wall", "marketing SaaS hero with 3 cards"],
            allowedComponents: ["WatchCanvas", "MaterialSelectorPills", "CaliberSpecBadge", "ViewingButton"],
            layoutDescription: "Obsidian darkroom stage with gold grazing light and interactive 360 watch plinth.",
          },
          {
            route: "/craftsmanship",
            pageRole: "Movement Architecture & Finissage",
            dominantStructure: "ASYMMETRIC_TECTONIC_STUDY",
            primaryFocalElement: "Exploded caliber loupe showing hand-beveled anglage, black polish, and balance wheel",
            bannedPatterns: ["search bar", "cards grid"],
            allowedComponents: ["CaliberExplodedViewer", "AnglageMacroLoupe", "HorologicalLineageTimeline"],
            layoutDescription: "Macro split view: exploded caliber components alongside artisanal finishing monographs.",
          },
          {
            route: "/materials",
            pageRole: "Metallurgical Metallurgy Comparison",
            dominantStructure: "METALLURGY_COMPARISON_STAGE",
            primaryFocalElement: "Side-by-side metallurgical examination of Grade-5 Titanium, 18k 5N Rose Gold, and 950 Platinum",
            bannedPatterns: ["e-commerce shopping filters", "add to cart buttons"],
            allowedComponents: ["MaterialPlinth", "HardnessScaleGauge", "ThermalConductivityChart"],
            layoutDescription: "Curated 3-metal plinth showcasing light refraction, tactile weight, and finishing grain.",
          },
          {
            route: "/atelier",
            pageRole: "Maker's Chronicle & Independent Heritage",
            dominantStructure: "EDITORIAL_SPREAD",
            primaryFocalElement: "Atelier journal documenting 200 hours of manual decoration per individual movement",
            bannedPatterns: ["search bar", "standard card grid"],
            allowedComponents: ["ChronicleNarrative", "MasterWatchmakerBio", "WorkshopGallerySpread"],
            layoutDescription: "Editorial narrative spread pairing workshop workbench photography with horologist philosophy.",
          },
          {
            route: "/private-viewing",
            pageRole: "Private Salon Appointment Concierge",
            dominantStructure: "CONCIERGE_SALON",
            primaryFocalElement: "Bespoke appointment concierge for Geneva, Paris, and New York salon viewings",
            bannedPatterns: ["standard web form with generic textareas"],
            allowedComponents: ["SalonCitySelector", "PrivateDateScheduler", "ConciergeRequestTrigger"],
            layoutDescription: "Understated appointment card with velvet presentation tray metaphor and private concierge confirmation.",
          },
        ],
      },
      typographyLanguage: {
        displayFont: "Playfair Display, Georgia, serif",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "refined-luxury",
        uppercaseTracking: true,
        dropCapAllowed: true,
      },
      visualHierarchy: {
        dominantVisualAnchor: "Central rotatable manufacture timepiece bathed in golden rim lighting",
        secondaryFoci: ["Material selector pill dock", "Caliber reference badges", "Concierge viewing CTA"],
        whitespaceScale: "cinematic-fullbleed",
        contrastModel: "dramatic-chiaroscuro",
      },
      surfaceMaterialLanguage: {
        philosophy: "Satin-brushed titanium, grand feu enamel, sapphire crystal, and matte graphite plinths.",
        borderTreatment: "1px solid rgba(212, 175, 55, 0.2)",
        shadowDepth: "0 25px 50px rgba(0, 0, 0, 0.8)",
        backgroundShaderOrTone: "#0c0d10",
        tactileFeedback: "Subtle metallic detent clicks when changing materials; smooth continuous rotational drag.",
      },
      motionLanguage: {
        easingCurve: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionSpeed: "smooth-cinematic",
        scrollCoupling: "ambient_drift",
        enterAnimation: "fade-slow",
      },
      interactionLanguage: {
        primaryVerb: "Inspect & Appraise",
        explorationStyle: "Orbital loupe drag, material metal toggle, caliber detail inspection",
        feedbackType: "Precise numerical spec updates + metallic shader reaction",
        stateChangeStyle: "Seamless material texture transitions on the 3D watch mesh",
      },
      contentPresentationLanguage: {
        presentationFormat: "Manufacture showcases, finishing monographs, and atelier chronicles",
        storyPacing: "Solemn, prestigious, exacting",
        mediaArrangement: "High-polygon 3D timepiece, macro movement photography, and horological credentials",
      },
      spatialTreatment: {
        focalObject: "Bespoke Tourbillon Timepiece with visible movement mechanics and sapphire caseback",
        sceneRole: "The sole heroic artifact on a dark studio plinth",
        cameraPhilosophy: "Loupe perspective allowing continuous 360 orbit and macro zoom into the balance spring",
        domIntegrationStyle: "Floating minimal gold wordmark and bottom material switcher overlaying dark canvas",
      },
      transitionLanguage: {
        betweenPages: "Velvet fade transition with plinth repositioning",
        betweenScenes: "Axial camera rotation from dial to exhibition caseback",
        scrollAnchor: "Divergent chapter scrolls",
      },
      responsiveStrategy: {
        desktopLayout: "Centered watch stage with floating top wordmark and bottom material switcher",
        tabletLayout: "Stage with compact material pills",
        mobileAdaptation: "Full-width touch-rotatable watch with bottom sheet caliber specifications",
      },
    };
  }

  private static buildEditorialPublicationIdentity(
    brandName: string,
    brandTagline: string,
    nav: NavigationDesign,
    raw: string,
    contract?: any
  ): WebsiteExperienceIdentity {
    const isCulinary = /\b(culinary|food|travel|recipe|gastronom|restaurant|chef|terroir)\b/i.test(raw);
    const defaultTagline = isCulinary
      ? "Culinary Travel & Terroir Monograph"
      : "Independent Architecture & Tectonic Journal";
    const defaultEssence = isCulinary
      ? "High-end print culinary travel magazine brought to life digitally with regional food journeys, chef profiles, and curated itineraries."
      : "Avant-garde architecture journal pairing oversized serif typography, full-bleed photography, and scroll-driven tectonic essays.";
    const defaultProhibition = isCulinary
      ? "A culinary travel magazine must feel like a premium printed monograph brought to life digitally, NOT a generic SaaS dashboard or card grid."
      : "An architecture journal must feel like a printed spatial monograph, NOT a database records list or search/filter directory.";

    return {
      id: `identity_editorial_${Date.now()}`,
      genre: "EDITORIAL_PUBLICATION",
      brandIdentity: {
        name: brandName,
        tagline: brandTagline || defaultTagline,
        essence: defaultEssence,
        tone: isCulinary ? "refined, warm, evocative, tactile" : "intellectual, visceral, austere, monumental",
        voice: isCulinary ? "epicurean, narrative, authentic" : "critical, curatorial, evocative",
      },
      navigationDesign: nav,
      pageCompositionLanguage: {
        layoutFamily: "EDITORIAL_MONOGRAPH",
        rhythm: "spacious-monograph",
        gridSystem: "asymmetric-editorial-spread",
        heroPhilosophy: isCulinary
          ? "Monumental serif headline with lead culinary feature, regional terroir indicator, and full-bleed food photography."
          : "Monumental typography headline with author monograph, issue volume number, and full-bleed tectonic imagery.",
        asymmetricSpreadsAllowed: true,
        fullBleedMediaAllowed: true,
        cardProhibitionReason: defaultProhibition,
        pageCompositionRules: [
          {
            route: "/",
            pageRole: "Monograph Cover & Spatial Manifesto",
            dominantStructure: "EDITORIAL_SPREAD",
            primaryFocalElement: "Dramatic oversized headline paired with curatorial manifesto and featured case-study spread",
            bannedPatterns: ["search bar + filter chips", "card grid", "records table"],
            allowedComponents: ["MastheadTitle", "ManifestoParagraph", "TectonicCaseStudyFeature", "IssueMetadata"],
            layoutDescription: "Editorial spread with oversized serif typography, issue index, and highlighted structural monograph.",
          },
          {
            route: "/visual-essays",
            pageRole: "Scroll-Driven Visual Photo Essay",
            dominantStructure: "SCROLL_VISUAL_ESSAY",
            primaryFocalElement: "Cinematic scrollytelling visual essay with full-bleed photographs, pull-quotes, and chapter transitions",
            bannedPatterns: ["card grid", "filter chips", "search bar"],
            allowedComponents: ["ScrollySceneContainer", "FullBleedPhotoSpread", "ItalicPullQuote", "ChapterMarker"],
            layoutDescription: "Scroll-driven visual essay: full-bleed photographic chapters advancing smoothly as user scrolls.",
          },
          {
            route: "/case-studies",
            pageRole: "Deep Tectonic Monograph Analysis",
            dominantStructure: "ASYMMETRIC_TECTONIC_STUDY",
            primaryFocalElement: "In-depth case studies with structural system drawings, material specs, and geological context",
            bannedPatterns: ["standard 3-column card grid", "search bar with filter tags"],
            allowedComponents: ["TectonicMonographSpread", "MaterialSpecTable", "StructuralAxonometricViewer"],
            layoutDescription: "Asymmetric publication layout: architectural photography alongside tectonic analysis and material specs.",
          },
          {
            route: "/architects",
            pageRole: "Architect Profiles & Studio Monograph",
            dominantStructure: "EDITORIAL_SPREAD",
            primaryFocalElement: "Curatorial profiles exploring philosophy, seminal projects, and archival interviews",
            bannedPatterns: ["staff directory cards", "contact badges"],
            allowedComponents: ["ArchitectCuratorialEssay", "InterviewPullQuote", "BuiltWorksLineage"],
            layoutDescription: "Curatorial monograph profiles with archival quotes and chronological lineage of built works.",
          },
          {
            route: "/gallery",
            pageRole: "Curated Archival Photography Folio",
            dominantStructure: "FULL_BLEED_STAGE",
            primaryFocalElement: "High-resolution architectural photography spreads with lighting annotations and elevation notes",
            bannedPatterns: ["e-commerce gallery grid", "search bar"],
            allowedComponents: ["HighResImageSpread", "ElevationCaption", "CuratorialIndex"],
            layoutDescription: "Full-bleed photographic folio with minimal elevation annotations and architectural captions.",
          },
        ],
      },
      typographyLanguage: {
        displayFont: "Playfair Display, Didot, Bodoni MT, serif",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "heroic-editorial",
        uppercaseTracking: true,
        pullQuoteStyle: "font-serif italic text-2xl md:text-4xl text-amber-200 border-l-2 border-amber-500 pl-6 my-8",
        marginaliaStyle: "font-mono text-xs text-amber-400/80 tracking-widest uppercase",
        dropCapAllowed: true,
      },
      visualHierarchy: {
        dominantVisualAnchor: "Monumental editorial typography headline and full-bleed architectural photography",
        secondaryFoci: ["Pull quotes", "Material specification tables", "Issue volume markers"],
        whitespaceScale: "generous",
        contrastModel: "dramatic-chiaroscuro",
      },
      surfaceMaterialLanguage: {
        philosophy: "Matte raw paper, monolithic quartzite, rammed earth, and dark basalt stone.",
        borderTreatment: "1px solid rgba(245, 158, 11, 0.2)",
        shadowDepth: "none",
        backgroundShaderOrTone: "#0a0e17",
        tactileFeedback: "Subtle page turn hints, smooth scrollytelling parallax, elegant footnote toggles.",
      },
      motionLanguage: {
        easingCurve: "cubic-bezier(0.25, 1, 0.5, 1)",
        transitionSpeed: "smooth-cinematic",
        scrollCoupling: "tight_dolly",
        enterAnimation: "fade-up",
      },
      interactionLanguage: {
        primaryVerb: "Read & Contemplate",
        explorationStyle: "Scroll-driven visual essays, footnote reveals, high-res photo inspection",
        feedbackType: "Smooth chapter scroll transitions and pull-quote reveals",
        stateChangeStyle: "Continuous document flow with scrollytelling cues",
      },
      contentPresentationLanguage: {
        presentationFormat: "Spatial essays, architectural monographs, and photographic folios",
        storyPacing: "Deep, intellectual, immersive",
        mediaArrangement: "Full-bleed imagery paired with marginalia and architectural drawings",
      },
      transitionLanguage: {
        betweenPages: "Clean editorial cut with instant typography focus",
        betweenScenes: "Scroll-driven photographic scene advance with chapter numbering",
        scrollAnchor: "Scene-indexed scroll tracking (data-scene, data-chapter)",
      },
      responsiveStrategy: {
        desktopLayout: "Asymmetric dual-column editorial layout with full-bleed photographic hero",
        tabletLayout: "Balanced single-column editorial spread with generous margins",
        mobileAdaptation: "Sequential typography and photo essay flow with sticky minimal masthead",
      },
    };
  }

  private static buildConsoleIdentity(
    brandName: string,
    brandTagline: string,
    nav: NavigationDesign,
    raw: string,
    contract?: any
  ): WebsiteExperienceIdentity {
    return {
      id: `identity_console_${Date.now()}`,
      genre: "HIGH_DENSITY_CONSOLE",
      brandIdentity: {
        name: brandName,
        tagline: brandTagline || "Operational Telemetry & Control Platform",
        essence: "High-frequency precision console with live streaming metrics, state monitoring, and operational controls.",
        tone: "technical, precise, vigilant, rapid",
        voice: "concise, exact, data-centric",
      },
      navigationDesign: nav,
      pageCompositionLanguage: {
        layoutFamily: "COMMAND_CONSOLE",
        rhythm: "dense-scientific",
        gridSystem: "command-grid-12",
        heroPhilosophy: "Live telemetry stream with primary system KPI status and streaming sensor charts.",
        asymmetricSpreadsAllowed: false,
        fullBleedMediaAllowed: false,
        pageCompositionRules: [
          {
            route: "/",
            pageRole: "Live Operations Overview",
            dominantStructure: "DENSE_TELEMETRY_GRID",
            primaryFocalElement: "Realtime metrics matrix and primary system stream",
            bannedPatterns: ["marketing hero banner", "generic SaaS 3 cards"],
            allowedComponents: ["MetricStrip", "LiveChart", "DispatchQueue"],
            layoutDescription: "High-density telemetry dashboard with live streaming charts and status badges.",
          },
        ],
      },
      typographyLanguage: {
        displayFont: "JetBrains Mono, Menlo, monospace",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "technical-mono",
        uppercaseTracking: true,
        dropCapAllowed: false,
      },
      visualHierarchy: {
        dominantVisualAnchor: "Live updating telemetry stream and primary operational status indicator",
        secondaryFoci: ["Alert queue", "System topology rail"],
        whitespaceScale: "compact-data",
        contrastModel: "sleek-dark",
      },
      surfaceMaterialLanguage: {
        philosophy: "Technical dark graphite, neon phosphor accents, precision hairline dividers.",
        borderTreatment: "1px solid rgba(255, 255, 255, 0.1)",
        shadowDepth: "none",
        backgroundShaderOrTone: "#0b0f19",
        tactileFeedback: "Instant keyboard shortcuts, crisp status badges, zero-latency toggles.",
      },
      motionLanguage: {
        easingCurve: "linear",
        transitionSpeed: "instant",
        scrollCoupling: "standard_flow",
        enterAnimation: "none",
      },
      interactionLanguage: {
        primaryVerb: "Monitor & Dispatch",
        explorationStyle: "High-density filter matrix, keyboard shortcuts, realtime threshold tuning",
        feedbackType: "Instant data stream tick and telemetry recalculation",
        stateChangeStyle: "In-place delta updates without layout shifts",
      },
      contentPresentationLanguage: {
        presentationFormat: "Telemetry grids, sparklines, and status queues",
        storyPacing: "Rapid, realtime, continuous",
        mediaArrangement: "Data charts, SVG vectors, and tabular telemetry",
      },
      transitionLanguage: {
        betweenPages: "Instant tab swap",
        betweenScenes: "In-place telemetry view change",
        scrollAnchor: "Standard viewport",
      },
      responsiveStrategy: {
        desktopLayout: "12-column command console layout with persistent status rail",
        tabletLayout: "Tabbed operational panes with dense metric clusters",
        mobileAdaptation: "Prioritized single-column metric feed with quick-action sheet",
      },
    };
  }

  private static buildDynamicBespokeIdentity(
    brandName: string,
    brandTagline: string,
    nav: NavigationDesign,
    raw: string,
    contract?: any
  ): WebsiteExperienceIdentity {
    return {
      id: `identity_bespoke_${Date.now()}`,
      genre: "DYNAMIC_BESPOKE",
      brandIdentity: {
        name: brandName,
        tagline: brandTagline || "Bespoke Digital Experience",
        essence: "Tailor-made web experience crafted to express the unique purpose and interactions of the product.",
        tone: "purposeful, engaging, refined",
        voice: "authentic, direct, domain-appropriate",
      },
      navigationDesign: nav,
      pageCompositionLanguage: {
        layoutFamily: "BESPOKE_SHOWCASE",
        rhythm: "calm-ambient",
        gridSystem: "flexible-modular",
        heroPhilosophy: "Domain-specific focal workspace presenting the primary capability directly without boilerplate.",
        asymmetricSpreadsAllowed: true,
        fullBleedMediaAllowed: true,
        pageCompositionRules: [
          {
            route: "/",
            pageRole: "Primary Domain Workspace",
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
            primaryFocalElement: "Direct domain interactive workspace",
            bannedPatterns: ["generic 3 SaaS cards", "marketing hero + CTA"],
            allowedComponents: ["PrimaryWorkspace", "DomainControls"],
            layoutDescription: "Dedicated domain workspace tailored to the core product activity.",
          },
        ],
      },
      typographyLanguage: {
        displayFont: "Outfit, system-ui, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "balanced",
        uppercaseTracking: false,
        dropCapAllowed: false,
      },
      visualHierarchy: {
        dominantVisualAnchor: "Primary domain interactive tool or stage",
        secondaryFoci: ["Auxiliary controls", "Curated details"],
        whitespaceScale: "generous",
        contrastModel: "clean-neutral",
      },
      surfaceMaterialLanguage: {
        philosophy: "Clean tailored surfaces with tactile contrast and domain color tokens.",
        borderTreatment: "1px solid var(--color-border, rgba(0,0,0,0.1))",
        shadowDepth: "0 10px 30px rgba(0, 0, 0, 0.08)",
        backgroundShaderOrTone: "var(--color-background, #fafafa)",
        tactileFeedback: "Subtle micro-interactions, smooth hover lifts, state feedback.",
      },
      motionLanguage: {
        easingCurve: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionSpeed: "snappy",
        scrollCoupling: "standard_flow",
        enterAnimation: "fade-up",
      },
      interactionLanguage: {
        primaryVerb: "Explore & Engage",
        explorationStyle: "Direct manipulation, interactive controls, live previews",
        feedbackType: "Visual state reflection and reactive previews",
        stateChangeStyle: "Smooth state transitions with immediate user feedback",
      },
      contentPresentationLanguage: {
        presentationFormat: "Interactive domain tools and curated showcases",
        storyPacing: "Natural, guided, responsive",
        mediaArrangement: "Contextual media paired with interactive controls",
      },
      transitionLanguage: {
        betweenPages: "Smooth route fade",
        betweenScenes: "Contextual state change",
        scrollAnchor: "Standard viewport",
      },
      responsiveStrategy: {
        desktopLayout: "Spacious modular grid",
        tabletLayout: "Adaptive split view",
        mobileAdaptation: "Stacked flow with sticky navigation",
      },
    };
  }
}
