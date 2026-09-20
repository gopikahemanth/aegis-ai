/**
 * CapabilityPlanner
 *
 * Ranks features from a project specification by user-facing importance and
 * plans page-level information architecture. The core insight is that a
 * "daily check-in" (touched by 100% of users, every day) is a primary feature
 * while "usage statistics" (viewed occasionally by a fraction of users) is a
 * supporting feature. This prevents the homepage from becoming a uniform grid.
 *
 * No LLM. Purely deterministic scoring based on ProductCharacteristics and
 * the specification's feature list.
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
}

export interface FeaturePriority {
  features: FeatureNode[];    // all planned features combined
  core: FeatureNode[];        // primary daily actions — get the most visual weight
  secondary: FeatureNode[];   // supporting — present but not dominant
  insights: FeatureNode[];    // analytics/history — subordinate

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

// ─── Per-experiencePattern page templates ─────────────────────────────────────

type PageTemplate = {
  pages: Omit<PageNode, "requiredDataShapes">[];
  primaryInteraction: string;
  navigationDepth: "shallow" | "deep";
};

const PAGE_TEMPLATES: Record<ProductCharacteristics["experiencePattern"], PageTemplate> = {
  "personal-tracker": {
    primaryInteraction: "Daily check-in or log entry",
    navigationDepth: "shallow",
    pages: [
      {
        route: "/",
        name: "Today",
        primaryFocus: "The primary daily action — check-in, log entry, or habit completion",
        heroElement: "large-interaction",
        supportingElements: ["current streak", "today's quick summary", "last entry preview"],
      },
      {
        route: "/history",
        name: "History",
        primaryFocus: "Chronological log of past entries",
        heroElement: "timeline-scroll",
        supportingElements: ["date filter", "entry preview cards", "export"],
      },
      {
        route: "/progress",
        name: "Progress",
        primaryFocus: "Visual progress toward goals and streaks",
        heroElement: "progress-visualization",
        supportingElements: ["trend chart", "milestone badges", "best streak"],
      },
      {
        route: "/insights",
        name: "Insights",
        primaryFocus: "Patterns, trends, and analytics derived from logged data",
        heroElement: "metric-cluster",
        supportingElements: ["weekly trend", "comparison chart", "averages"],
      },
      {
        route: "/settings",
        name: "Settings",
        primaryFocus: "Preferences, reminders, and account",
        heroElement: "form-flow",
        supportingElements: ["reminder time", "units", "data export"],
      },
    ],
  },

  "operations-dashboard": {
    primaryInteraction: "Monitor key metrics and drill into details",
    navigationDepth: "deep",
    pages: [
      {
        route: "/",
        name: "Overview",
        primaryFocus: "High-level KPI summary and health status",
        heroElement: "metric-cluster",
        supportingElements: ["status list", "recent alerts", "trend sparklines"],
      },
      {
        route: "/analytics",
        name: "Analytics",
        primaryFocus: "In-depth charts and time-series analysis",
        heroElement: "metric-cluster",
        supportingElements: ["date range filter", "breakdown charts", "comparison view"],
      },
      {
        route: "/records",
        name: "Records",
        primaryFocus: "Filterable, sortable data table",
        heroElement: "timeline-scroll",
        supportingElements: ["search", "column filter", "export", "pagination"],
      },
      {
        route: "/alerts",
        name: "Alerts",
        primaryFocus: "Active and historical alerts or notifications",
        heroElement: "timeline-scroll",
        supportingElements: ["severity filter", "resolve action", "history"],
      },
      {
        route: "/settings",
        name: "Settings",
        primaryFocus: "Configuration and administration",
        heroElement: "form-flow",
        supportingElements: ["thresholds", "notifications", "access control"],
      },
    ],
  },

  "content-feed": {
    primaryInteraction: "Discover and consume content",
    navigationDepth: "shallow",
    pages: [
      {
        route: "/",
        name: "Discover",
        primaryFocus: "Curated or algorithmic content feed",
        heroElement: "showcase-grid",
        supportingElements: ["category pills", "trending section", "featured editorial"],
      },
      {
        route: "/browse",
        name: "Browse",
        primaryFocus: "Searchable, filterable content catalog",
        heroElement: "showcase-grid",
        supportingElements: ["search bar", "tag filter", "sort options"],
      },
      {
        route: "/saved",
        name: "Saved",
        primaryFocus: "User's saved or bookmarked items",
        heroElement: "timeline-scroll",
        supportingElements: ["remove action", "reading progress", "share"],
      },
      {
        route: "/profile",
        name: "Profile",
        primaryFocus: "User preferences and reading history",
        heroElement: "editorial-hero",
        supportingElements: ["reading stats", "interests", "settings link"],
      },
    ],
  },

  "catalog-browser": {
    primaryInteraction: "Browse and select from a catalog",
    navigationDepth: "shallow",
    pages: [
      {
        route: "/",
        name: "Catalog",
        primaryFocus: "Full product or item catalog with filtering",
        heroElement: "showcase-grid",
        supportingElements: ["category sidebar", "sort", "search", "quick-view"],
      },
      {
        route: "/item/:id",
        name: "Item Detail",
        primaryFocus: "Single item detail with rich media and action",
        heroElement: "editorial-hero",
        supportingElements: ["image gallery", "description", "CTA button", "related items"],
      },
      {
        route: "/wishlist",
        name: "Saved / Wishlist",
        primaryFocus: "User's curated collection",
        heroElement: "showcase-grid",
        supportingElements: ["remove action", "share", "add to cart"],
      },
      {
        route: "/about",
        name: "About",
        primaryFocus: "Brand story, provenance, mission",
        heroElement: "editorial-hero",
        supportingElements: ["founder story", "values", "press"],
      },
    ],
  },

  "workspace-editor": {
    primaryInteraction: "Create and edit content or designs",
    navigationDepth: "deep",
    pages: [
      {
        route: "/",
        name: "Home",
        primaryFocus: "Recent projects and quick-start",
        heroElement: "showcase-grid",
        supportingElements: ["recent files", "templates", "search"],
      },
      {
        route: "/editor/:id",
        name: "Editor",
        primaryFocus: "Primary editing canvas",
        heroElement: "form-flow",
        supportingElements: ["toolbar", "properties panel", "layers"],
      },
      {
        route: "/templates",
        name: "Templates",
        primaryFocus: "Starter templates",
        heroElement: "showcase-grid",
        supportingElements: ["category filter", "preview", "use template"],
      },
      {
        route: "/settings",
        name: "Settings",
        primaryFocus: "Preferences and account",
        heroElement: "form-flow",
        supportingElements: ["profile", "integrations", "billing"],
      },
    ],
  },

  "configurator-workspace": {
    primaryInteraction: "Configure custom models, calculate physical/engineering parameters, and generate project estimates",
    navigationDepth: "deep",
    pages: [
      {
        route: "/",
        name: "Studio Workspace",
        primaryFocus: "Interactive studio workspace with direct access to configurators, calculators, and estimators",
        heroElement: "large-interaction",
        supportingElements: ["fixture configuration canvas", "live photometric lux metrics", "project quote summary"],
      },
      {
        route: "/configurator",
        name: "Configurator",
        primaryFocus: "Custom fixture/model configuration workspace",
        heroElement: "large-interaction",
        supportingElements: ["model selector", "dimension sliders", "optic and finish controls"],
      },
      {
        route: "/calculator",
        name: "Photometric Calculator",
        primaryFocus: "Lux distribution and physical calculation engine",
        heroElement: "metric-cluster",
        supportingElements: ["lux heatmaps", "parameter inputs", "distribution chart"],
      },
      {
        route: "/estimator",
        name: "Quote Estimator",
        primaryFocus: "Project quote estimation and financial breakdown",
        heroElement: "form-flow",
        supportingElements: ["cost breakdown table", "lead-time estimator", "quote export"],
      },
    ],
  },

  "booking-flow": {
    primaryInteraction: "Find availability and complete a booking",
    navigationDepth: "shallow",
    pages: [
      {
        route: "/",
        name: "Home",
        primaryFocus: "Search or browse with availability CTA",
        heroElement: "large-interaction",
        supportingElements: ["search form", "featured options", "social proof"],
      },
      {
        route: "/browse",
        name: "Browse",
        primaryFocus: "Availability listing with filters",
        heroElement: "showcase-grid",
        supportingElements: ["date picker", "filters", "map toggle", "sort"],
      },
      {
        route: "/book/:id",
        name: "Booking",
        primaryFocus: "Booking flow — details, date, confirmation",
        heroElement: "form-flow",
        supportingElements: ["calendar", "guest count", "price summary", "confirm CTA"],
      },
      {
        route: "/bookings",
        name: "My Bookings",
        primaryFocus: "Past and upcoming reservations",
        heroElement: "timeline-scroll",
        supportingElements: ["status badge", "cancel action", "receipt download"],
      },
    ],
  },

  "showcase-landing": {
    primaryInteraction: "Impress visitors and drive contact",
    navigationDepth: "shallow",
    pages: [
      {
        route: "/",
        name: "Home",
        primaryFocus: "Hero headline, brand statement, and featured work",
        heroElement: "editorial-hero",
        supportingElements: ["featured projects", "services list", "CTA"],
      },
      {
        route: "/work",
        name: "Work",
        primaryFocus: "Portfolio grid of projects or case studies",
        heroElement: "showcase-grid",
        supportingElements: ["category filter", "hover previews", "year filter"],
      },
      {
        route: "/about",
        name: "About",
        primaryFocus: "Studio story, team, and philosophy",
        heroElement: "editorial-hero",
        supportingElements: ["bio", "values", "press logos"],
      },
      {
        route: "/contact",
        name: "Contact",
        primaryFocus: "Contact form and direct info",
        heroElement: "form-flow",
        supportingElements: ["inquiry form", "email", "location"],
      },
    ],
  },

  "team-workspace": {
    primaryInteraction: "Coordinate work across team members",
    navigationDepth: "deep",
    pages: [
      {
        route: "/",
        name: "Dashboard",
        primaryFocus: "Team activity summary and active tasks",
        heroElement: "metric-cluster",
        supportingElements: ["activity feed", "due today", "member avatars"],
      },
      {
        route: "/tasks",
        name: "Tasks",
        primaryFocus: "Task list or board view",
        heroElement: "timeline-scroll",
        supportingElements: ["assign", "due date", "status", "priority badge"],
      },
      {
        route: "/members",
        name: "Members",
        primaryFocus: "Team roster and role management",
        heroElement: "showcase-grid",
        supportingElements: ["invite", "role badge", "last active"],
      },
      {
        route: "/schedule",
        name: "Schedule",
        primaryFocus: "Shared calendar or timeline view",
        heroElement: "calendar",
        supportingElements: ["event creation", "member filter", "view toggle"],
      },
      {
        route: "/settings",
        name: "Settings",
        primaryFocus: "Workspace preferences and integrations",
        heroElement: "form-flow",
        supportingElements: ["notifications", "permissions", "integrations"],
      },
    ],
  },

  "realtime-console": {
    primaryInteraction: "Monitor live data and respond to alerts",
    navigationDepth: "deep",
    pages: [
      {
        route: "/",
        name: "Console",
        primaryFocus: "Live data stream and critical metrics",
        heroElement: "metric-cluster",
        supportingElements: ["live ticker", "alert banner", "status lights"],
      },
      {
        route: "/positions",
        name: "Positions / Status",
        primaryFocus: "Current state of all monitored entities",
        heroElement: "timeline-scroll",
        supportingElements: ["P&L or status column", "quick action", "filter"],
      },
      {
        route: "/history",
        name: "History",
        primaryFocus: "Past events and time-series analysis",
        heroElement: "metric-cluster",
        supportingElements: ["date range", "chart", "export"],
      },
      {
        route: "/alerts",
        name: "Alerts",
        primaryFocus: "Active and resolved alerts",
        heroElement: "timeline-scroll",
        supportingElements: ["severity", "resolve", "silence"],
      },
      {
        route: "/settings",
        name: "Settings",
        primaryFocus: "Thresholds, notifications, and configuration",
        heroElement: "form-flow",
        supportingElements: ["threshold editor", "notification channels"],
      },
    ],
  },
};

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

// ─────────────────────────────────────────────────────────────────────────────

function scoreFeature(featureName: string): {
  priority: FeatureNode["visualPriority"];
  frequency: FeatureNode["estimatedUsageFrequency"];
  dataShape: DataShape;
} {
  const name = featureName.toLowerCase();

  // Priority scoring
  const primaryScore = PRIMARY_ACTION_SIGNALS.filter(s => name.includes(s)).length;
  const insightScore  = INSIGHT_SIGNALS.filter(s => name.includes(s)).length;

  let priority: FeatureNode["visualPriority"] = "secondary";
  if (primaryScore >= 1) priority = "primary";
  else if (insightScore >= 1) priority = "tertiary";

  // Frequency scoring
  let frequency: FeatureNode["estimatedUsageFrequency"] = "weekly";
  if (primaryScore >= 1 || name.includes("daily") || name.includes("today")) frequency = "daily";
  else if (insightScore >= 1 || name.includes("report") || name.includes("export")) frequency = "occasional";

  // Data shape inference
  let dataShape: DataShape = "list";
  if (/progress|streak|goal|ring|completion/.test(name))    dataShape = "progress";
  else if (/history|timeline|log|journal|feed/.test(name))  dataShape = "timeline";
  else if (/chart|graph|trend|analytic|statistic/.test(name)) dataShape = "comparison";
  else if (/check.?in|log|entry|add|record|capture/.test(name)) dataShape = "single-value";
  else if (/map|location|route|geography/.test(name))       dataShape = "map";
  else if (/book|reserv|order|schedule|appoint/.test(name)) dataShape = "form-flow";
  else if (/gallery|photo|image|grid/.test(name))           dataShape = "media-grid";
  else if (/calendar|week view/.test(name))                  dataShape = "calendar";

  return { priority, frequency, dataShape };
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
   * Plans feature priority and information architecture from product characteristics
   * and an optional specification. The experiencePattern drives the page template;
   * actual specification features adjust feature priorities and hero overrides.
   *
   * @param characteristics  ProductCharacteristics from ProductUnderstanding.analyze()
   * @param spec             Optional project specification (for feature extraction)
   */
  static plan(characteristics: ProductCharacteristics, spec?: any): FeaturePriority {
    const featureNames = extractFeatureNames(spec);
    const experiencePattern = characteristics.experiencePattern;

    // Classify features
    const core: FeatureNode[] = [];
    const secondary: FeatureNode[] = [];
    const insights: FeatureNode[] = [];

    for (const name of featureNames) {
      const { priority, frequency, dataShape } = scoreFeature(name);
      const node: FeatureNode = {
        name,
        userIntent: `User wants to ${name.toLowerCase()}`,
        dataShape,
        estimatedUsageFrequency: frequency,
        visualPriority: priority,
      };
      if (priority === "primary") core.push(node);
      else if (priority === "tertiary") insights.push(node);
      else secondary.push(node);
    }

    // If no features were parsed (spec is undefined), generate representative defaults
    // based purely on experience pattern
    if (featureNames.length === 0) {
      const defaults = this.defaultFeaturesFor(experiencePattern);
      core.push(...defaults.core);
      secondary.push(...defaults.secondary);
      insights.push(...defaults.insights);
    }

    // Build page IA from template
    const template = PAGE_TEMPLATES[experiencePattern];
    const pages: PageNode[] = template.pages.map(p => ({
      ...p,
      heroElement: resolveHeroElement(p.heroElement, featureNames),
      requiredDataShapes: core
        .filter(f => !f.suggestedPage || f.suggestedPage === p.route)
        .map(f => f.dataShape),
    }));

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

    return {
      features: [...core, ...secondary, ...insights],
      core,
      secondary,
      insights,
      informationArchitecture: {
        pages,
        primaryInteraction: template.primaryInteraction,
        navigationDepth: template.navigationDepth,
      },
    };
  }

  /**
   * Generates representative default features when no spec is available.
   * Used during design-director initialization before full spec parsing.
   */
  private static defaultFeaturesFor(pattern: ProductCharacteristics["experiencePattern"]): {
    core: FeatureNode[];
    secondary: FeatureNode[];
    insights: FeatureNode[];
  } {
    const defaults: Record<ProductCharacteristics["experiencePattern"], {
      core: FeatureNode[];
      secondary: FeatureNode[];
      insights: FeatureNode[];
    }> = {
      "personal-tracker": {
        core: [
          { name: "Daily check-in", userIntent: "Log today's data", dataShape: "single-value", estimatedUsageFrequency: "daily", visualPriority: "primary" },
          { name: "Streak tracker", userIntent: "See consistency", dataShape: "progress", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Entry history", userIntent: "Review past entries", dataShape: "timeline", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Progress analytics", userIntent: "Understand patterns", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "operations-dashboard": {
        core: [
          { name: "KPI overview", userIntent: "See current status", dataShape: "comparison", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Records list", userIntent: "Browse all records", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Trend report", userIntent: "Understand over time", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "content-feed": {
        core: [
          { name: "Feed", userIntent: "Discover content", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Search", userIntent: "Find specific content", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
          { name: "Saved collection", userIntent: "Review saved items", dataShape: "timeline", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Reading history", userIntent: "Track consumption", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "catalog-browser": {
        core: [
          { name: "Browse catalog", userIntent: "Explore items", dataShape: "media-grid", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Wishlist", userIntent: "Save items", dataShape: "list", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
          { name: "Item details", userIntent: "Inspect specifications", dataShape: "single-value", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Curated collections", userIntent: "Discover featured items", dataShape: "media-grid", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "workspace-editor": {
        core: [
          { name: "Editor", userIntent: "Create content", dataShape: "form-flow", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Recent files", userIntent: "Continue working", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
          { name: "Template library", userIntent: "Start from template", dataShape: "media-grid", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Version history", userIntent: "Review past versions", dataShape: "timeline", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "configurator-workspace": {
        core: [
          { name: "Model Configurator", userIntent: "Configure custom fixtures and components", dataShape: "form-flow", estimatedUsageFrequency: "daily", visualPriority: "primary" },
          { name: "Engineering Calculator", userIntent: "Simulate lux distribution and physics parameters", dataShape: "comparison", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Quote Estimator", userIntent: "Generate pricing and project quote breakdowns", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Specification Breakdown", userIntent: "Export technical specification and telemetry", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "booking-flow": {
        core: [
          { name: "Availability search", userIntent: "Find available slots", dataShape: "form-flow", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "My bookings", userIntent: "View reservations", dataShape: "list", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Booking history", userIntent: "Review past reservations", dataShape: "timeline", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "showcase-landing": {
        core: [
          { name: "Portfolio showcase", userIntent: "View work", dataShape: "media-grid", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Case studies", userIntent: "Read project narratives", dataShape: "timeline", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
          { name: "Contact", userIntent: "Get in touch", dataShape: "form-flow", estimatedUsageFrequency: "occasional", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Press and honors", userIntent: "Review recognition", dataShape: "list", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "team-workspace": {
        core: [
          { name: "Task board", userIntent: "See team tasks", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Team members", userIntent: "See who is on the team", dataShape: "list", estimatedUsageFrequency: "weekly", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Progress report", userIntent: "Track velocity", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
      "realtime-console": {
        core: [
          { name: "Live console", userIntent: "Monitor live data", dataShape: "single-value", estimatedUsageFrequency: "daily", visualPriority: "primary" },
        ],
        secondary: [
          { name: "Alerts", userIntent: "Respond to issues", dataShape: "list", estimatedUsageFrequency: "daily", visualPriority: "secondary" },
        ],
        insights: [
          { name: "Historical analysis", userIntent: "Understand trends", dataShape: "comparison", estimatedUsageFrequency: "occasional", visualPriority: "tertiary" },
        ],
      },
    };

    return defaults[pattern] || defaults["operations-dashboard"];
  }
}
