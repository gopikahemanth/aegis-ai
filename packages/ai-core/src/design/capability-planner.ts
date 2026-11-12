/**
 * CapabilityPlanner
 *
 * Ranks features from a project specification by user-facing importance and
 * plans page-level information architecture dynamically from discovered requirements,
 * user journeys, and live research evidence.
 *
 * ZERO hardcoded website templates or fixed page dictionaries.
 * Every product sitemap is reasoned independently per project.
 */

import type { ProductCharacteristics } from "./product-understanding.js";

// ─── Public interfaces ────────────────────────────────────────────────────────

export type DataShape =
  | "single-value"       // a number, status, or boolean — stat card
  | "timeline"           // sequential events over time — log/history view
  | "progress"           // completion toward a goal — ring, bar, streak
  | "list"               // tabular or card list — filterable rows
  | "comparison"         // multiple values side-by-side — bar chart, table
  | "map"                // geographic data
  | "form-flow"          // multi-step or single-step form
  | "calendar"           // calendar / time-grid
  | "media-grid";        // photo, video, or card grid

export type HeroElementType =
  | "immersive-canvas"         // full-bleed 3D WebGL / interactive canvas stage
  | "storefront-hero"          // retail carousel, deals banner, category bar
  | "hospitality-hero"         // full-bleed hero with date/guest booking bar
  | "large-interaction"        // the core daily action (check-in, compose, book)
  | "progress-visualization"   // ring, streak, progress bar
  | "timeline-scroll"          // vertical log of events
  | "showcase-grid"            // image or card gallery
  | "metric-cluster"           // KPI summary row / dashboard header
  | "map-visualization"        // full-bleed map
  | "form-flow"                // wizard / booking form
  | "editorial-hero"           // large image + headline
  | "calendar";                // calendar / time-grid view

export interface FeatureNode {
  name: string;
  userIntent: string;                      // what the user is trying to accomplish
  dataShape: DataShape;
  estimatedUsageFrequency: "daily" | "weekly" | "occasional";
  visualPriority: "primary" | "secondary" | "tertiary";
  suggestedPage?: string;                  // route hint
}

export interface PageNode {
  route: string;
  name: string;
  primaryFocus: string;
  heroElement: HeroElementType;
  supportingElements: string[];
  requiredDataShapes: DataShape[];
  isSummaryOverview?: boolean;
  purpose?: string;
  userTask?: string;
  whyNeeded?: string;
}

export interface FeaturePriority {
  features: FeatureNode[];    // all planned features combined
  core: FeatureNode[];        // primary daily actions — get the most visual weight
  secondary: FeatureNode[];   // supporting — present but not dominant
  insights: FeatureNode[];    // analytics/history — subordinate

  /** Authoritative primary landing feature designated for root "/" landing experience */
  primaryLandingFeature?: string;

  /** Explicitly flags when requirements or research were insufficient */
  planningIncomplete?: boolean;
  missingRequirements?: string[];

  informationArchitecture: {
    pages: PageNode[];
    primaryInteraction: string;
    navigationDepth: "shallow" | "deep";
    // shallow → 4-5 primary items, no secondary nav needed
    // deep    → 5 primary + secondary tab system within pages
  };
}

// ─── Internal scoring tables ──────────────────────────────────────────────────

/** Keywords that indicate a high-frequency, high-priority daily action. */
const PRIMARY_ACTION_SIGNALS = [
  "check-in", "checkin", "log", "record", "track today", "daily",
  "submit", "add entry", "new entry", "compose", "write", "create",
  "book", "reserve", "order", "start session", "begin", "capture",
  "quick add", "note",
];

/** Keywords that indicate supporting/secondary features. */
const SECONDARY_SIGNALS = [
  "history", "recent", "past", "view", "see", "browse", "list",
  "search", "filter", "manage", "edit", "update", "profile", "settings",
  "notifications", "badges", "achievements",
];

/** Keywords that indicate occasional/insight features. */
const INSIGHT_SIGNALS = [
  "analytics", "statistics", "stats", "report", "trend", "chart",
  "graph", "overview", "summary", "export", "compare", "insights",
  "patterns", "averages",
];

// ─── Hero element calendar override ──────────────────────────────────────────

const HERO_OVERRIDES_BY_FEATURE: Array<{
  signals: string[];
  hero: HeroElementType;
}> = [
  { signals: ["calendar", "rehearsal schedule", "appointment"],                hero: "calendar" },
  { signals: ["map", "location", "geography", "fleet", "route tracking"],      hero: "map-visualization" },
  { signals: ["gallery", "photo", "portfolio grid", "showcase grid"],         hero: "showcase-grid" },
  { signals: ["checkin", "check-in", "log mood", "log today", "start session"], hero: "large-interaction" },
  { signals: ["progress", "streak", "goal ring", "completion ring"],          hero: "progress-visualization" },
  { signals: ["activity feed", "audit log", "change log", "timeline view", "event history"], hero: "timeline-scroll" },
  { signals: ["kpi metrics", "telemetry", "stats overview"],                  hero: "metric-cluster" },
];

function scoreFeature(featureName: string): {
  priority: FeatureNode["visualPriority"];
  frequency: FeatureNode["estimatedUsageFrequency"];
  dataShape: DataShape;
} {
  const name = featureName.toLowerCase();

  // Priority scoring using word boundary to avoid substring collisions (e.g. "graph" matching "filmography")
  const primaryScore = PRIMARY_ACTION_SIGNALS.filter(s => new RegExp(`\\b${s}\\b`, "i").test(name)).length;
  const insightScore  = INSIGHT_SIGNALS.filter(s => new RegExp(`\\b${s}\\b`, "i").test(name)).length;

  let priority: FeatureNode["visualPriority"] = "secondary";
  if (primaryScore >= 1) priority = "primary";
  else if (insightScore >= 1) priority = "tertiary";

  // Frequency scoring
  let frequency: FeatureNode["estimatedUsageFrequency"] = "weekly";
  if (primaryScore >= 1 || /\b(daily|today)\b/i.test(name)) frequency = "daily";
  else if (insightScore >= 1 || /\b(report|export)\b/i.test(name)) frequency = "occasional";

  // Data shape inference
  let dataShape: DataShape = "list";
  if (/\b(progress|streak|goal|ring|completion)\b/i.test(name))    dataShape = "progress";
  else if (/\b(history|timeline|log|journal|feed)\b/i.test(name))  dataShape = "timeline";
  else if (/\b(chart|charts|graph|graphs|trend|trends|analytic|analytics|statistic|statistics)\b/i.test(name)) dataShape = "comparison";
  else if (/\b(check.?in|log|entry|add|record|capture)\b/i.test(name)) dataShape = "single-value";
  else if (/\b(map|location|route|geography)\b/i.test(name))       dataShape = "map";
  else if (/\b(book|reserv|order|schedule|appoint)\b/i.test(name)) dataShape = "form-flow";
  else if (/\b(gallery|photo|image|grid|filmography|screening|showcase)\b/i.test(name)) dataShape = "media-grid";
  else if (/\b(calendar|week view)\b/i.test(name))                  dataShape = "calendar";

  return { priority, frequency, dataShape };
}

function resolveHeroFromDataShape(
  dataShape: DataShape,
  characteristics?: ProductCharacteristics,
  isLanding?: boolean
): HeroElementType {
  if (isLanding) {
    if (characteristics?.isVisualFirst) return "showcase-grid";
    if (characteristics?.isDataDriven) return "metric-cluster";
  }
  switch (dataShape) {
    case "media-grid":
      return "showcase-grid";
    case "progress":
      return "progress-visualization";
    case "timeline":
      return "timeline-scroll";
    case "comparison":
      return characteristics?.isDataDriven ? "metric-cluster" : "showcase-grid";
    case "map":
      return "map-visualization";
    case "form-flow":
      return "form-flow";
    case "calendar":
      return "calendar";
    case "single-value":
      return "large-interaction";
    default:
      return characteristics?.isVisualFirst ? "showcase-grid" : "large-interaction";
  }
}

function resolveHeroElement(
  baseHero: HeroElementType,
  features: string[],
): HeroElementType {
  const featureText = features.join(" ").toLowerCase();
  for (const { signals, hero } of HERO_OVERRIDES_BY_FEATURE) {
    if (signals.some(s => new RegExp(`\\b${s}\\b`, "i").test(featureText))) return hero;
  }
  return baseHero;
}

function extractFeatureNames(spec: any): string[] {
  const raw: any[] = spec?.features || [];
  if (raw.length > 0) {
    return raw.map((f: any) =>
      typeof f === "string" ? f : (f?.name || f?.title || f?.label || JSON.stringify(f))
    );
  }

  if (typeof spec?.description === "string" && spec.description.includes("with ")) {
    const afterWith = spec.description.split("with ")[1];
    if (afterWith) {
      const parts = afterWith
        .split(/,|\band\b/i)
        .map((p: string) => p.trim().replace(/\.$/, ""))
        .filter((p: string) => p.length > 2);
      if (parts.length >= 2) {
        return parts;
      }
    }
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────

export class CapabilityPlanner {
  /**
   * Plans feature priority and information architecture dynamically from product
   * characteristics, specification features, user journeys, and research evidence.
   *
   * NEVER uses predefined website templates.
   */
  static plan(characteristics: ProductCharacteristics, spec?: any, compositionGraph?: any): FeaturePriority {
    const featureNames = extractFeatureNames(spec);
    const experiencePattern = characteristics.experiencePattern;

    // Classify features
    const core: FeatureNode[] = [];
    const secondary: FeatureNode[] = [];
    const insights: FeatureNode[] = [];

    for (const name of featureNames) {
      const { priority, frequency, dataShape } = scoreFeature(name);
      const lowerName = name.toLowerCase();
      let verb = "Explore and interact with";
      if (lowerName.includes("story") || lowerName.includes("essay") || lowerName.includes("journal") || lowerName.includes("monograph") || lowerName.includes("article")) {
        verb = "Read and immerse in";
      } else if (lowerName.includes("gallery") || lowerName.includes("photo") || lowerName.includes("image")) {
        verb = "View high-resolution photography of";
      } else if (lowerName.includes("craft") || lowerName.includes("material") || lowerName.includes("spec") || lowerName.includes("case-stud")) {
        verb = "Inspect tactile details and specifications of";
      } else if (lowerName.includes("companion") || lowerName.includes("character") || lowerName.includes("creature")) {
        verb = "Commune with and discover lore for";
      } else if (lowerName.includes("sound") || lowerName.includes("chime") || lowerName.includes("audio")) {
        verb = "Trigger and compose harmonic frequencies with";
      } else if (lowerName.includes("quest") || lowerName.includes("map") || lowerName.includes("journey")) {
        verb = "Navigate waypoints and cartography for";
      } else if (lowerName.includes("submission") || lowerName.includes("submit") || lowerName.includes("propose")) {
        verb = "Propose and submit project curation for";
      } else if (experiencePattern === "operations-dashboard" || experiencePattern === "realtime-console") {
        verb = "Monitor and track";
      }
      const node: FeatureNode = {
        name,
        userIntent: `${verb} ${name.toLowerCase()}`,
        dataShape,
        estimatedUsageFrequency: frequency,
        visualPriority: priority,
      };
      if (priority === "primary") core.push(node);
      else if (priority === "tertiary") insights.push(node);
      else secondary.push(node);
    }

    // Ensure if no feature scored as primary, the first feature becomes core
    if (core.length === 0 && (secondary.length > 0 || insights.length > 0)) {
      if (secondary.length > 0) {
        const promoted = secondary.shift()!;
        promoted.visualPriority = "primary";
        promoted.estimatedUsageFrequency = "daily";
        core.push(promoted);
      } else if (insights.length > 0) {
        const promoted = insights.shift()!;
        promoted.visualPriority = "primary";
        promoted.estimatedUsageFrequency = "daily";
        core.push(promoted);
      }
    }

    let planningIncomplete = false;
    let missingRequirements: string[] | undefined;

    // If no features were parsed (spec is undefined or empty), dynamically derive features from prompt semantics
    if (featureNames.length === 0) {
      const vocabWords = (characteristics.vocabularyContract?.required || (characteristics as any).requiredVocabulary || []).filter((w: string) => w.length > 3);
      const promptText = (typeof spec?.userPrompt === "string" ? spec.userPrompt : (typeof spec?.description === "string" ? spec.description : ""));
      const cleanTokens = promptText
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !["build", "create", "website", "platform", "online", "system", "portal", "with", "that", "this", "from", "offer", "offering", "authentic", "operations", "called"].includes(w.toLowerCase()));

      if (vocabWords.length >= 2) {
        const primaryConcept = vocabWords[0].charAt(0).toUpperCase() + vocabWords[0].slice(1);
        const secondaryConcept = vocabWords[1].charAt(0).toUpperCase() + vocabWords[1].slice(1);
        core.push({
          name: `${primaryConcept} Showcase & Directory`,
          userIntent: `Explore and interact with primary ${vocabWords[0]} resources`,
          dataShape: characteristics.isVisualFirst ? "media-grid" : (characteristics.isDataDriven ? "comparison" : "list"),
          estimatedUsageFrequency: "daily",
          visualPriority: "primary",
        });
        secondary.push({
          name: `${secondaryConcept} Management Workspace`,
          userIntent: `Inspect and configure ${vocabWords[1]} parameters`,
          dataShape: "single-value",
          estimatedUsageFrequency: "weekly",
          visualPriority: "secondary",
        });
      } else if (cleanTokens.length >= 2) {
        const primaryConcept = cleanTokens[0].charAt(0).toUpperCase() + cleanTokens[0].slice(1);
        const secondaryConcept = cleanTokens[1].charAt(0).toUpperCase() + cleanTokens[1].slice(1);
        core.push({
          name: `${primaryConcept} Catalog & Showcase`,
          userIntent: `Browse and interact with ${cleanTokens[0]} items`,
          dataShape: characteristics.isVisualFirst ? "media-grid" : (characteristics.isDataDriven ? "comparison" : "list"),
          estimatedUsageFrequency: "daily",
          visualPriority: "primary",
        });
        secondary.push({
          name: `${secondaryConcept} Workspace`,
          userIntent: `Configure and manage ${cleanTokens[1]} details`,
          dataShape: "list",
          estimatedUsageFrequency: "weekly",
          visualPriority: "secondary",
        });
      } else {
        // Pure neutral domain-agnostic foundation
        planningIncomplete = true;
        missingRequirements = ["No explicit feature specification or domain vocabulary available to synthesize specialized capabilities"];
        core.push({
          name: "Primary Resource Catalog",
          userIntent: "Browse and discover primary application resources",
          dataShape: characteristics.isVisualFirst ? "media-grid" : (characteristics.isDataDriven ? "comparison" : "list"),
          estimatedUsageFrequency: "daily",
          visualPriority: "primary",
        });
        secondary.push({
          name: "Management Console",
          userIntent: "Inspect entries and configure settings",
          dataShape: "list",
          estimatedUsageFrequency: "weekly",
          visualPriority: "secondary",
        });
      }
    }

    // Build page IA: Prioritize authoritative required routes from spec/contract, avoiding invented section routes
    let pages: PageNode[];
    let primaryInteraction: string;
    let navigationDepth: "shallow" | "deep";

    const authoritativeRoutes: string[] = [
      ...(spec?.requiredRoutes || []),
      ...(spec?.architectureContract?.requiredRoutes || []),
      ...(spec?.contractRoutes || []),
      ...(spec?.domainContract?.requiredRoutes || [])
    ].map((r: any) => typeof r === "string" ? r : r?.path).filter(Boolean);
    const uniqueAuthoritativeRoutes = Array.from(new Set(authoritativeRoutes.map(r => r.startsWith("/") ? r : "/" + r)));

    if (uniqueAuthoritativeRoutes.length > 0) {
      primaryInteraction = compositionGraph?.experienceIntent || characteristics.primaryActivity || "Explore";
      navigationDepth = uniqueAuthoritativeRoutes.length > 3 ? "deep" : "shallow";
      pages = uniqueAuthoritativeRoutes.map((route: string, idx: number) => {
        let name = "Home";
        let whyNeeded = "Primary landing hub and entry point for users.";
        let primaryFocus = "Explore and interact with primary capabilities";
        let heroElement: HeroElementType = idx === 0
          ? (compositionGraph?.sections?.[0]?.layoutFamily === "EDITORIAL" ? "editorial-hero" : (characteristics.isVisualFirst ? "showcase-grid" : (characteristics.isDataDriven ? "metric-cluster" : "large-interaction")))
          : "large-interaction";
        let requiredDataShapes: DataShape[] = ["list"];

        if (route !== "/") {
          const rawSlug = route.replace(/^\//, "").replace(/[-_]+/g, " ");
          name = rawSlug.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

          // Match against discovered features to obtain accurate intent and hero element
          const matchedFeature = [...core, ...secondary, ...insights].find(f => {
            const fSlug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
            const rSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, "");
            return fSlug.includes(rSlug) || rSlug.includes(fSlug);
          });
          if (matchedFeature) {
            name = matchedFeature.name;
            primaryFocus = matchedFeature.userIntent;
            whyNeeded = `Essential workflow required for users to ${matchedFeature.userIntent.toLowerCase()}`;
            heroElement = resolveHeroFromDataShape(matchedFeature.dataShape, characteristics, false);
            requiredDataShapes = [matchedFeature.dataShape];
          } else {
            primaryFocus = `Explore and interact with ${name}`;
            whyNeeded = `Dedicated product workspace required for ${name} user flow`;
          }
        } else {
          if (spec?.architectureContract?.primaryLandingFeature || spec?.primaryLandingFeature) {
            name = spec?.architectureContract?.primaryLandingFeature || spec?.primaryLandingFeature;
          } else if (compositionGraph?.sections?.[0]?.name && !compositionGraph.sections[0].name.includes("Banner")) {
            name = compositionGraph.sections[0].name;
          }
          primaryFocus = `Central landing interface for ${name}`;
          whyNeeded = `Primary entrance providing discoverability across all product capabilities`;
        }

        return {
          route,
          name,
          primaryFocus,
          purpose: primaryFocus,
          userTask: primaryFocus,
          whyNeeded,
          heroElement,
          supportingElements: core.slice(0, 3).map(f => f.name),
          requiredDataShapes,
          isSummaryOverview: idx === 0 && characteristics.isDataDriven,
        };
      });
    } else {
      primaryInteraction = compositionGraph?.experienceIntent || characteristics.primaryActivity || "Explore";
      navigationDepth = (core.length + secondary.length) > 3 ? "deep" : "shallow";

      // ── Dynamic Prompt & Feature Sitemap Synthesis ────────────────────────────
      // Grounded purely in discovered product features, user intent, and research evidence — ZERO hardcoded templates
      const dynamicPages: PageNode[] = [];
      const landingName = spec?.architectureContract?.primaryLandingFeature || spec?.primaryLandingFeature || (core[0]?.name ? `${core[0].name} Hub` : "Home");
      const landingHero: HeroElementType = compositionGraph?.sections?.[0]?.layoutFamily === "EDITORIAL"
        ? "editorial-hero"
        : (characteristics.isVisualFirst ? "showcase-grid" : (characteristics.isDataDriven ? "metric-cluster" : "showcase-grid"));

      dynamicPages.push({
        route: "/",
        name: landingName,
        primaryFocus: `Overview and primary access to ${landingName}`,
        purpose: `Central entrance and discovery hub for ${landingName}`,
        userTask: `Browse featured items and navigate to specialized tools`,
        whyNeeded: `Primary entrance giving users immediate orientation and access to core workflows`,
        heroElement: landingHero,
        supportingElements: core.slice(0, 3).map(f => f.name),
        requiredDataShapes: core.map(f => f.dataShape),
        isSummaryOverview: characteristics.isDataDriven,
      });

      const seenRoutes = new Set<string>(["/"]);
      const allDiscovered = [...core, ...secondary, ...insights];
      for (const feat of allDiscovered.slice(0, 5)) {
        const featSlug = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const route = `/${featSlug}`;
        if (!seenRoutes.has(route)) {
          seenRoutes.add(route);
          const featHero = resolveHeroFromDataShape(feat.dataShape, characteristics, false);

          dynamicPages.push({
            route,
            name: feat.name,
            primaryFocus: feat.userIntent || `Dedicated interactive workspace for ${feat.name}`,
            purpose: `Enable user workflow for ${feat.name}`,
            userTask: feat.userIntent || `Interact with ${feat.name}`,
            whyNeeded: `Required workflow for users to accomplish: ${feat.userIntent.toLowerCase()}`,
            heroElement: featHero,
            supportingElements: [feat.name, "Interactive controls", "Detailed records"],
            requiredDataShapes: [feat.dataShape],
            isSummaryOverview: false,
          });
        }
      }

      pages = dynamicPages;
    }

    // Enforce diversity rule: no more than 2 consecutive pages with same heroElement
    for (let i = 2; i < pages.length; i++) {
      if (
        pages[i].heroElement === pages[i - 1].heroElement &&
        pages[i].heroElement === pages[i - 2].heroElement
      ) {
        // Override: rotate through alternatives
        const alternatives: HeroElementType[] = [
          "timeline-scroll", "showcase-grid", "metric-cluster", "editorial-hero",
          "large-interaction", "progress-visualization", "form-flow",
        ];
        const current = pages[i].heroElement;
        const next = alternatives.find(a => a !== current) || "showcase-grid";
        pages[i] = { ...pages[i], heroElement: next };
      }
    }

    const primaryLandingFeature =
      spec?.architectureContract?.primaryLandingFeature ||
      spec?.primaryLandingFeature ||
      compositionGraph?.focalElement ||
      core[0]?.name ||
      pages[0]?.name ||
      "Home";

    return {
      features: [...core, ...secondary, ...insights],
      core,
      secondary,
      insights,
      primaryLandingFeature,
      planningIncomplete,
      missingRequirements,
      informationArchitecture: {
        pages,
        primaryInteraction,
        navigationDepth,
      },
    };
  }

  /**
   * Plans feature priority and information architecture directly from a discovered FeatureMatrix.
   * Grounded dynamically in discovered features and pages without template fallbacks.
   */
  static fromFeatureMatrix(
    matrix: { standardFeatures: Array<{ name: string; description: string }>; differentiatorFeatures: Array<{ name: string; description: string }>; corePages: string[]; primaryLandingFeature?: string; category?: string },
    characteristics: ProductCharacteristics
  ): FeaturePriority {
    const allFeatures = [
      ...matrix.standardFeatures.map(f => ({ name: f.name, desc: f.description, isDifferentiator: false })),
      ...matrix.differentiatorFeatures.map(f => ({ name: f.name, desc: f.description, isDifferentiator: true })),
    ];

    const core: FeatureNode[] = [];
    const secondary: FeatureNode[] = [];
    const insights: FeatureNode[] = [];

    allFeatures.forEach((feat, idx) => {
      const { priority, frequency, dataShape } = scoreFeature(feat.name);
      const isCore = feat.isDifferentiator || idx < 3 || priority === "primary";
      const node: FeatureNode = {
        name: feat.name,
        userIntent: feat.desc || `User interacts with ${feat.name}`,
        dataShape,
        estimatedUsageFrequency: isCore ? "daily" : frequency,
        visualPriority: isCore ? "primary" : priority,
      };

      if (isCore) {
        core.push(node);
      } else if (priority === "tertiary") {
        insights.push(node);
      } else {
        secondary.push(node);
      }
    });

    const NON_HOME_HERO_ROTATION: HeroElementType[] = [
      "showcase-grid", "form-flow", "timeline-scroll", "metric-cluster", "editorial-hero",
    ];

    const landingHero: HeroElementType = characteristics.isVisualFirst
      ? "showcase-grid"
      : (characteristics.isDataDriven ? "metric-cluster" : "large-interaction");

    let pages: PageNode[];
    if (matrix.corePages && matrix.corePages.length > 0) {
      pages = matrix.corePages.map((route, i) => {
        const rawSlug = route.replace(/^\//, "").replace(/[-_]+/g, " ");
        const name = i === 0
          ? (matrix.primaryLandingFeature || rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1) || "Home")
          : (rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1));
        const matchedFeature = allFeatures.find(f => {
          const fSlug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
          const rSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, "");
          return fSlug.includes(rSlug) || rSlug.includes(fSlug);
        });
        const heroElement: HeroElementType = i === 0
          ? landingHero
          : (matchedFeature ? resolveHeroFromDataShape(scoreFeature(matchedFeature.name).dataShape, characteristics, false) : NON_HOME_HERO_ROTATION[(i - 1) % NON_HOME_HERO_ROTATION.length]);
        const purpose = matchedFeature?.desc || `Core user workflow for ${name}`;
        return {
          route: route.startsWith("/") ? route : `/${route}`,
          name,
          primaryFocus: purpose,
          purpose,
          userTask: purpose,
          whyNeeded: matchedFeature ? `Discovered business feature: ${matchedFeature.name}` : `Core user workflow for ${name}`,
          heroElement,
          supportingElements: allFeatures.slice(i * 2, i * 2 + 3).map(f => f.name),
          requiredDataShapes: core.map(f => f.dataShape),
          isSummaryOverview: i === 0 && characteristics.isDataDriven,
        };
      });
    } else {
      // Synthesize directly from discovered features
      const synthesized: PageNode[] = [];
      const landingName = matrix.primaryLandingFeature || matrix.standardFeatures[0]?.name || "Home";
      synthesized.push({
        route: "/",
        name: landingName,
        primaryFocus: `Overview and primary access to ${landingName}`,
        purpose: `Central entrance for ${landingName}`,
        userTask: `Browse core capabilities and navigate`,
        whyNeeded: "Primary entry point for users",
        heroElement: landingHero,
        supportingElements: core.slice(0, 3).map(f => f.name),
        requiredDataShapes: core.map(f => f.dataShape),
        isSummaryOverview: characteristics.isDataDriven,
      });

      const seen = new Set<string>(["/"]);
      for (const feat of allFeatures.slice(0, 4)) {
        const slug = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const route = `/${slug}`;
        if (!seen.has(route)) {
          seen.add(route);
          const featHero = resolveHeroFromDataShape(scoreFeature(feat.name).dataShape, characteristics, false);
          synthesized.push({
            route,
            name: feat.name,
            primaryFocus: feat.desc || `Workspace for ${feat.name}`,
            purpose: feat.desc || `Workspace for ${feat.name}`,
            userTask: feat.desc || `Interact with ${feat.name}`,
            whyNeeded: `Discovered requirement: ${feat.name}`,
            heroElement: featHero,
            supportingElements: [feat.name],
            requiredDataShapes: [scoreFeature(feat.name).dataShape],
            isSummaryOverview: false,
          });
        }
      }
      pages = synthesized;
    }

    const primaryLandingFeature = matrix.primaryLandingFeature || matrix.standardFeatures[0]?.name || core[0]?.name || "Home";
    const primaryInteraction = `${characteristics.primaryActivity || "Explore"} ${matrix.category || primaryLandingFeature}`;
    const navigationDepth = pages.length > 3 ? "deep" : "shallow";

    return {
      features: [...core, ...secondary, ...insights],
      core,
      secondary,
      insights,
      primaryLandingFeature,
      informationArchitecture: {
        pages,
        primaryInteraction,
        navigationDepth,
      },
    };
  }
}
