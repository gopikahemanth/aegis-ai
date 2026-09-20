/**
 * DesignDirector
 *
 * The central design authority. Selects art direction from ProductCharacteristics
 * (NEVER from domain name), assembles the full ProductDesignBrief, and manages
 * the DesignBriefLock for provenance verification.
 *
 * THE ONE RULE:
 * No design decision is made because of a domain name (e.g. "wellness").
 * All decisions are derived from ProductCharacteristics extracted from the prompt.
 * The coder receives a LOCKED MANDATE and implements it — it does not design.
 */

import { createHash, randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import type { ProductCharacteristics } from "./product-understanding.js";
import type { FeaturePriority, HeroElementType, PageNode } from "./capability-planner.js";
import {
  deriveArtDirection,
  getContrastRatio,
  computeDeterministicHash,
  type VisualArtDirectionContract,
} from "./visual-art-direction.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export type DesignSelectionMode = "AUTO" | "USER_SELECTED" | "RANDOM" | "CUSTOM";

export interface ProductDesignBrief {
  briefId: string;
  briefVersion: "1.0";
  seed: number;
  selectionMode: DesignSelectionMode;

  briefMetadata: {
    generationId: string;     // UUID — ties brief to one specific generation run
    promptHash: string;       // SHA-256(rawPrompt.trim()) — detects stale brief reuse
    canonicalSpecHash: string; // SHA-256(JSON.stringify(canonicalSpec))
    createdAt: string;        // ISO 8601
  };

  provenanceHash: string;
  compositionBrief: {
    heroElement: HeroElementType;
    compositionFamily: string;
  };

  productCharacteristics: ProductCharacteristics;
  featurePriority: FeaturePriority;

  artDirectionName: string;
  artDirectionRationale: string; // e.g. "isPersonal=true + calm + warm → CALM_BOTANICAL"

  colorSystem: {
    background: string;
    surface: string;
    surfaceRaised: string;
    primary: string;
    primaryHover: string;
    primarySubtle: string;
    secondary: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderSubtle: string;
    success: string;
    warning: string;
    danger: string;
    chartPalette: string[]; // 6 colors — hue-span validated, WCAG contrast validated
  };

  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;
    headingStyle: string;
    bodyStyle: string;
    labelStyle: string;
    displayScale: "large" | "medium" | "compact";
  };

  geometry: {
    style: "soft" | "refined" | "sharp" | "organic";
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    radiusXl: string;
    radiusFull: string;
    borderWidth: "hairline" | "standard" | "thick";
    shadowStyle: "floating" | "flat" | "inset" | "glow" | "none";
  };

  motion: {
    language: "gentle" | "snappy" | "playful" | "precise" | "none";
    transitionDuration: string;
    easing: string;
    hoverScale: string;
    pageTransition: "fade" | "slide" | "none";
  };

  visualLanguage: {
    illustrationStyle:
      | "organic-botanical" | "geometric" | "photographic"
      | "minimal-line" | "3d-product" | "data-visualization" | "none";
    iconStyle: "rounded" | "sharp" | "duotone" | "filled";
    useTexture: boolean;
    useGradientOrbs: boolean;
    usePatterns: boolean;
  };

  navigation: {
    strategy: "bottom-tab" | "top-pill" | "sidebar-rail"
            | "minimal-sidebar" | "top-flat" | "command-console";
    maxPrimaryItems: number;    // hard cap ≤ 5, always
    showLabels: boolean;
    secondaryNav?: {
      strategy: "tabs" | "contextual-tabs" | "breadcrumb" | "none";
      description: string;
    };
  };

  componentLanguage: {
    cardStyle: string;
    buttonPrimary: string;
    buttonSecondary: string;
    inputStyle: string;
    badgeStyle: string;
    emptyStateCopy: Record<string, string>; // per-route: "Log your first check-in"
    loadingStyle: "skeleton" | "shimmer" | "spinner";
    chartStyle: string;
  };

  /**
   * Per-page composition plan.
   * RULE: ≤ 2 consecutive pages may share the same compositionFamily + heroElement.
   */
  pageCompositions: Array<{
    route: string;
    name: string;
    primaryFocus: string;
    heroElement: HeroElementType;
    secondaryElements: string[];
    tertiaryElements: string[];
    compositionFamily: string;
    visualRhythm: string;      // e.g. "LARGE → small → medium → LARGE"
    forbiddenPatterns: string[];
    vocabularyContext: string[]; // page-specific preferred words
  }>;

  designPrinciples: string[];

  vocabularyContract: {
    required: string[];    // must appear once in the app (not per page)
    preferred: string[];   // use naturally — NOT checked by gate
    forbidden: string[];   // CRITICAL violation if found in JSX text/labels
  };

  vocabularyConstraints: {
    required: string[];
    preferred: string[];
    forbidden: string[];
  };

  globalForbiddenPatterns: string[];
}

// ─── HSL utilities for chart palette derivation ───────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = Math.min(k(n), 8 - k(n), 1);
    return Math.round(255 * (l - a * Math.max(-1, c)));
  };
  return `#${f(0).toString(16).padStart(2, "0")}${f(8).toString(16).padStart(2, "0")}${f(4).toString(16).padStart(2, "0")}`;
}

/**
 * Derives 6-color chart palette from an archetype.
 * Takes 3 base colors from primaryVariants then rotates hue to generate 3 more.
 * Each candidate is WCAG-validated against the archetype's background (min contrast 2.5).
 */
export function deriveChartPalette(artDirection: VisualArtDirectionContract): string[] {
  // Extract 3 base colors from primaryVariants (use hex values)
  const background = artDirection.colorSystem.background;

  // We need the raw primaryVariants from the archetype — they're baked into colorSystem.primaryHex
  // Use primary + secondary + success/warning as starting seeds
  const seeds: string[] = [
    artDirection.colorSystem.primaryHex,
    artDirection.colorSystem.secondaryHex,
    artDirection.colorSystem.success,
    artDirection.colorSystem.warning,
    artDirection.colorSystem.danger,
  ].filter(h => h && h.startsWith("#"));

  // Derive 6 hue-spanning colors using the primary as origin
  const [baseH, baseS, baseL] = hexToHsl(seeds[0]);

  const candidates: string[] = [
    seeds[0],
    hslToHex((baseH + 30) % 360, baseS, baseL),
    hslToHex((baseH + 60) % 360, Math.min(baseS + 10, 100), baseL),
    hslToHex((baseH + 120) % 360, baseS, Math.max(baseL - 5, 20)),
    hslToHex((baseH + 180) % 360, baseS, baseL),
    hslToHex((baseH + 240) % 360, Math.min(baseS + 5, 100), Math.min(baseL + 5, 90)),
  ];

  // Replace any low-contrast candidates with nearest accessible hue
  const validated = candidates.map(hex => {
    const contrast = getContrastRatio(hex, background);
    if (contrast >= 2.5) return hex;
    // Boost lightness for dark backgrounds, reduce for light backgrounds
    const [h, s, l] = hexToHsl(hex);
    const isLight = getContrastRatio("#ffffff", background) < 3;
    const adjusted = hslToHex(h, s, isLight ? Math.max(l - 25, 20) : Math.min(l + 25, 85));
    return adjusted;
  });

  return validated;
}

// ─── Art direction mapping (from characteristics → archetype candidates) ──────

type ArchetypeKey =
  | "INDUSTRIAL_UTILITY" | "OCEANIC_MARITIME" | "CLINICAL_LABORATORY"
  | "EDITORIAL_HERITAGE" | "OBSIDIAN_PRECISION" | "MODERN_SWISS"
  | "BOTANICAL_EARTH" | "NORDIC_MINIMAL" | "AMBER_WARM_DARK"
  | "NEON_SYNTHETIC" | "EDITORIAL_NARRATIVE" | "RESTRAINED_PRODUCT"
  | "PLAYFUL_APPROACHABLE" | "SOPHISTICATED_ELEGANT" | "CALM_BOTANICAL";

function candidatesFromCharacteristics(
  characteristics: ProductCharacteristics,
  modeHint?: string,
): ArchetypeKey[] {
  const tone = characteristics.emotionalTone.primary;
  const secondary = characteristics.emotionalTone.secondary;
  const isPersonal = characteristics.audienceContext.isPersonal;
  const isDataDriven = characteristics.isDataDriven;
  const isProfessional = characteristics.audienceContext.isProfessional;

  // If modeHint from --design-mode=pick, filter toward that tone family
  if (modeHint) {
    const hint = modeHint.toLowerCase();
    if (hint.includes("calm") || hint.includes("botanical") || hint.includes("natural") || hint.includes("earthy")) {
      return isPersonal
        ? ["CALM_BOTANICAL", "BOTANICAL_EARTH", "EDITORIAL_NARRATIVE"]
        : ["BOTANICAL_EARTH", "CALM_BOTANICAL", "NORDIC_MINIMAL"];
    }
    if (hint.includes("playful") || hint.includes("fun") || hint.includes("friendly")) {
      return ["PLAYFUL_APPROACHABLE", "BOTANICAL_EARTH"];
    }
    if (hint.includes("dark") || hint.includes("obsidian") || hint.includes("technical")) {
      return isDataDriven
        ? ["SOPHISTICATED_ELEGANT", "OBSIDIAN_PRECISION"]
        : ["RESTRAINED_PRODUCT", "MODERN_SWISS"];
    }
    if (hint.includes("warm") || hint.includes("cozy") || hint.includes("amber")) {
      return ["AMBER_WARM_DARK", "EDITORIAL_HERITAGE", "CALM_BOTANICAL"];
    }
    if (hint.includes("editorial") || hint.includes("magazine") || hint.includes("publication")) {
      return ["EDITORIAL_NARRATIVE", "EDITORIAL_HERITAGE"];
    }
    if (hint.includes("minimal") || hint.includes("clean") || hint.includes("simple")) {
      return ["NORDIC_MINIMAL", "RESTRAINED_PRODUCT", "MODERN_SWISS"];
    }
  }

  // Derive from characteristics — primary tone drives candidate pool
  switch (tone) {
    case "calm":
      if (isPersonal) return ["CALM_BOTANICAL", "BOTANICAL_EARTH", "EDITORIAL_NARRATIVE"];
      return ["CALM_BOTANICAL", "NORDIC_MINIMAL", "EDITORIAL_NARRATIVE"];

    case "warm":
      if (isPersonal) return ["CALM_BOTANICAL", "PLAYFUL_APPROACHABLE", "BOTANICAL_EARTH"];
      return ["AMBER_WARM_DARK", "EDITORIAL_HERITAGE", "BOTANICAL_EARTH"];

    case "playful":
      return ["PLAYFUL_APPROACHABLE", "BOTANICAL_EARTH"];

    case "friendly":
      return ["PLAYFUL_APPROACHABLE", "EDITORIAL_NARRATIVE", "NORDIC_MINIMAL"];

    case "editorial":
      return ["EDITORIAL_NARRATIVE", "EDITORIAL_HERITAGE", "AMBER_WARM_DARK"];

    case "luxurious":
      return ["SOPHISTICATED_ELEGANT", "AMBER_WARM_DARK", "EDITORIAL_HERITAGE"];

    case "technical":
      if (isDataDriven && isProfessional) return ["SOPHISTICATED_ELEGANT", "OBSIDIAN_PRECISION", "INDUSTRIAL_UTILITY"];
      if (isDataDriven) return ["INDUSTRIAL_UTILITY", "OBSIDIAN_PRECISION", "MODERN_SWISS"];
      return ["INDUSTRIAL_UTILITY", "MODERN_SWISS", "RESTRAINED_PRODUCT"];

    case "serious":
      if (isDataDriven) return ["SOPHISTICATED_ELEGANT", "INDUSTRIAL_UTILITY", "OBSIDIAN_PRECISION"];
      return ["MODERN_SWISS", "RESTRAINED_PRODUCT", "NORDIC_MINIMAL"];

    case "energetic":
      return ["NEON_SYNTHETIC", "PLAYFUL_APPROACHABLE", "MODERN_SWISS"];

    default:
      // Fallback pool — no domain-name triggers here
      return ["RESTRAINED_PRODUCT", "EDITORIAL_NARRATIVE", "MODERN_SWISS", "NORDIC_MINIMAL"];
  }
}

// ─── Rationale builder ────────────────────────────────────────────────────────

function buildRationale(
  characteristics: ProductCharacteristics,
  archetypeName: string,
  modeHint?: string,
): string {
  const parts: string[] = [];
  if (characteristics.audienceContext.isPersonal) parts.push("isPersonal=true");
  if (characteristics.isDataDriven) parts.push("isDataDriven=true");
  parts.push(`tone.primary=${characteristics.emotionalTone.primary}`);
  if (characteristics.emotionalTone.secondary) parts.push(`tone.secondary=${characteristics.emotionalTone.secondary}`);
  parts.push(`pattern=${characteristics.experiencePattern}`);
  if (modeHint) parts.push(`modeHint="${modeHint}"`);
  return `${parts.join(" + ")} → ${archetypeName}`;
}

// ─── Navigation strategy mapping ─────────────────────────────────────────────

function resolveNavigationStrategy(
  characteristics: ProductCharacteristics,
  featurePriority: FeaturePriority,
): ProductDesignBrief["navigation"] {
  const { experiencePattern } = characteristics;
  const { navigationDepth } = featurePriority.informationArchitecture;
  const pageCount = featurePriority.informationArchitecture.pages.length;
  const isPersonal = characteristics.audienceContext.isPersonal;
  const isTechnical = characteristics.emotionalTone.primary === "technical";

  let strategy: ProductDesignBrief["navigation"]["strategy"];

  if (isPersonal && pageCount <= 5) {
    strategy = "bottom-tab";
  } else if (isTechnical && characteristics.isDataDriven) {
    strategy = navigationDepth === "deep" ? "sidebar-rail" : "command-console";
  } else if (experiencePattern === "showcase-landing") {
    strategy = "top-flat";
  } else if (experiencePattern === "catalog-browser" || experiencePattern === "content-feed") {
    strategy = "top-pill";
  } else if (navigationDepth === "deep") {
    strategy = "minimal-sidebar";
  } else {
    strategy = "top-pill";
  }

  const maxItems = Math.min(pageCount, 5); // HARD CAP

  return {
    strategy,
    maxPrimaryItems: maxItems,
    showLabels: strategy !== "sidebar-rail",
    secondaryNav: navigationDepth === "deep"
      ? { strategy: "contextual-tabs", description: "Secondary tabs within pages for sub-sections" }
      : undefined,
  };
}

// ─── Motion language mapping ──────────────────────────────────────────────────

function resolveMotion(characteristics: ProductCharacteristics): ProductDesignBrief["motion"] {
  const tone = characteristics.emotionalTone.primary;

  switch (tone) {
    case "calm":
    case "warm":
      return { language: "gentle", transitionDuration: "300ms", easing: "cubic-bezier(0.4, 0, 0.2, 1)", hoverScale: "1.01", pageTransition: "fade" };
    case "playful":
    case "friendly":
    case "energetic":
      return { language: "playful", transitionDuration: "200ms", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", hoverScale: "1.03", pageTransition: "slide" };
    case "technical":
    case "serious":
      return { language: "precise", transitionDuration: "150ms", easing: "cubic-bezier(0.0, 0.0, 0.2, 1)", hoverScale: "1.005", pageTransition: "none" };
    case "luxurious":
    case "editorial":
      return { language: "gentle", transitionDuration: "400ms", easing: "cubic-bezier(0.16, 1, 0.3, 1)", hoverScale: "1.01", pageTransition: "fade" };
    default:
      return { language: "snappy", transitionDuration: "200ms", easing: "ease-out", hoverScale: "1.02", pageTransition: "fade" };
  }
}

// ─── Visual language mapping ──────────────────────────────────────────────────

function resolveVisualLanguage(characteristics: ProductCharacteristics, archetypeName: string): ProductDesignBrief["visualLanguage"] {
  const tone = characteristics.emotionalTone.primary;
  const isBotanical = archetypeName.includes("BOTANICAL") || archetypeName.includes("CALM");
  const isEditorial = archetypeName.includes("EDITORIAL");
  const isNeon = archetypeName.includes("NEON");
  const isTechnical = archetypeName.includes("OBSIDIAN") || archetypeName.includes("INDUSTRIAL") || archetypeName.includes("SOPHISTICATED");

  return {
    illustrationStyle: isBotanical ? "organic-botanical" :
                       isEditorial ? "minimal-line" :
                       isNeon ? "geometric" :
                       isTechnical ? "data-visualization" :
                       characteristics.isVisualFirst ? "photographic" : "none",
    iconStyle: archetypeName.includes("MODERN_SWISS") ? "sharp" :
               archetypeName.includes("PLAYFUL") ? "rounded" :
               archetypeName.includes("NORDIC") ? "rounded" : "filled",
    useTexture: isBotanical || isEditorial,
    useGradientOrbs: isNeon || tone === "playful" || tone === "energetic",
    usePatterns: archetypeName.includes("INDUSTRIAL") || archetypeName.includes("OBSIDIAN"),
  };
}

// ─── Page composition builder ─────────────────────────────────────────────────

type CompositionFamily =
  | "HERO_FIRST"      // large hero + supporting content below
  | "GRID_CATALOG"    // equal-weight card grid
  | "DASHBOARD"       // metric header + content body
  | "EDITORIAL"       // image + text alternating
  | "TIMELINE"        // vertical chronological
  | "FORM_CENTRIC"    // form as the primary element
  | "CONSOLE"         // dense data terminal view
  | "TRACKER";        // personal tracker with streak/progress hero

const COMPOSITION_FAMILY_MAP: Record<HeroElementType, CompositionFamily> = {
  "large-interaction":      "TRACKER",
  "progress-visualization": "TRACKER",
  "timeline-scroll":        "TIMELINE",
  "showcase-grid":          "GRID_CATALOG",
  "metric-cluster":         "DASHBOARD",
  "map-visualization":      "HERO_FIRST",
  "form-flow":              "FORM_CENTRIC",
  "editorial-hero":         "EDITORIAL",
  "calendar":               "DASHBOARD",
};

const FORBIDDEN_PATTERNS_BY_FAMILY: Record<CompositionFamily, string[]> = {
  "TRACKER":     ["Generic KPI grid as hero", "Admin table as primary content", "Sidebar navigation for personal tracker"],
  "TIMELINE":    ["Card grid as hero", "Metric cluster without context", "Admin sidebar"],
  "GRID_CATALOG": ["Timeline as hero", "Sidebar nav without benefit", "Single-column card list"],
  "DASHBOARD":   ["Empty hero section", "No data visualization", "Text wall without metrics"],
  "EDITORIAL":   ["Card grid layout", "Dense data table", "Admin sidebar"],
  "FORM_CENTRIC": ["Multiple simultaneous forms", "Card grid hero", "Dashboard header"],
  "CONSOLE":     ["Soft decorative illustration", "Large editorial hero", "Bottom tab navigation"],
  "HERO_FIRST":  ["Multiple competing hero sections", "Dense data table", "Admin sidebar"],
};

const VISUAL_RHYTHM_BY_FAMILY: Record<CompositionFamily, string> = {
  "TRACKER":     "LARGE interaction → compact summary → medium chart",
  "TIMELINE":    "LARGE timeline hero → detail cards → action footer",
  "GRID_CATALOG": "featured editorial → GRID cards → pagination",
  "DASHBOARD":   "METRIC row → medium charts → data list",
  "EDITORIAL":   "HERO image + headline → content sections → CTA",
  "FORM_CENTRIC": "FORM hero → help text → confirmation",
  "CONSOLE":     "DENSE header → data rows → status footer",
  "HERO_FIRST":  "FULL-BLEED hero → feature sections → footer",
};

const VOCABULARY_BY_FAMILY: Record<CompositionFamily, string[]> = {
  "TRACKER":     ["Today", "Check in", "Streak", "Progress", "Reflect"],
  "TIMELINE":    ["History", "Recent", "Past", "Entry"],
  "GRID_CATALOG": ["Browse", "Discover", "View", "Featured", "Explore"],
  "DASHBOARD":   ["Overview", "Metrics", "Performance", "Filter", "Export"],
  "EDITORIAL":   ["Story", "Feature", "Read", "About", "Work"],
  "FORM_CENTRIC": ["Book", "Reserve", "Confirm", "Schedule", "Details"],
  "CONSOLE":     ["Status", "Alert", "Live", "Monitor", "Active"],
  "HERO_FIRST":  ["Explore", "Discover", "Featured", "Get Started"],
};

function buildEmptyStateCopy(pages: PageNode[], characteristics: ProductCharacteristics): Record<string, string> {
  const copy: Record<string, string> = {};
  for (const page of pages) {
    const family = COMPOSITION_FAMILY_MAP[page.heroElement] || "DASHBOARD";
    switch (family) {
      case "TRACKER":
        copy[page.route] = `Log your first entry to get started`;
        break;
      case "TIMELINE":
        copy[page.route] = `Your history will appear here once you start tracking`;
        break;
      case "GRID_CATALOG":
        copy[page.route] = `Nothing to show yet — check back soon`;
        break;
      case "DASHBOARD":
        copy[page.route] = `Data will appear here once available`;
        break;
      case "FORM_CENTRIC":
        copy[page.route] = `Complete the form above to get started`;
        break;
      default:
        copy[page.route] = `Nothing to show here yet`;
    }
  }
  return copy;
}

// ─── SHA-256 helper ───────────────────────────────────────────────────────────

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

// ─── DesignDirector class ─────────────────────────────────────────────────────

export class DesignDirector {
  /**
   * Selects art direction from product characteristics — NOT from domain name.
   *
   * @param characteristics  ProductCharacteristics from ProductUnderstanding
   * @param seed             Deterministic hash seed (from prompt)
   * @param modeHint         Optional tone hint from --design-mode=pick (e.g. "calm")
   */
  static selectArtDirection(
    characteristics: ProductCharacteristics,
    seed: number,
    modeHint?: string,
  ): VisualArtDirectionContract {
    const candidates = candidatesFromCharacteristics(characteristics, modeHint);
    const archetypeKey = candidates[Math.abs(seed) % candidates.length];

    // Build a representative prompt from characteristics for deriveArtDirection
    // (which still needs a prompt string internally) — NO domain name, only tone signals
    const syntheticPrompt = [
      characteristics.emotionalTone.primary,
      characteristics.emotionalTone.secondary || "",
      characteristics.experiencePattern.replace(/-/g, " "),
      characteristics.audienceContext.isPersonal ? "personal" : "",
      characteristics.isDataDriven ? "analytics data" : "",
      characteristics.isVisualFirst ? "visual imagery" : "",
    ].filter(Boolean).join(" ");

    // Use CALM_BOTANICAL archetype if selected — it's a new archetype added by this plan
    if (archetypeKey === "CALM_BOTANICAL") {
      return buildCalmBotanicalContract(seed);
    }

    // For all other archetypes, use the existing deriveArtDirection with the archetype forced
    // by creating a synthetic prompt that will score toward the right candidate pool
    const artDirection = deriveArtDirection(syntheticPrompt);

    // If the auto-selected archetype doesn't match our candidate, we override it
    // by constructing the correct archetype deterministically
    if (!candidates.includes(artDirection.archetype as ArchetypeKey)) {
      // Force the selected archetype by passing its key signal keywords
      const archetypeSignals: Partial<Record<ArchetypeKey, string>> = {
        "INDUSTRIAL_UTILITY": "industrial utility sensor telemetry monitoring",
        "OCEANIC_MARITIME": "ocean maritime navigation",
        "CLINICAL_LABORATORY": "clinical laboratory diagnostic hospital",
        "EDITORIAL_HERITAGE": "editorial heritage museum archive monograph",
        "OBSIDIAN_PRECISION": "trading fintech order execution precision",
        "MODERN_SWISS": "minimal swiss typographic precision",
        "BOTANICAL_EARTH": "botanical earth ecology natural",
        "NORDIC_MINIMAL": "nordic minimal clean simple workspace",
        "AMBER_WARM_DARK": "amber warm dark vintage luxury",
        "NEON_SYNTHETIC": "neon synthetic cyberpunk electric",
        "EDITORIAL_NARRATIVE": "editorial narrative story publication",
        "RESTRAINED_PRODUCT": "restrained product saas developer",
        "PLAYFUL_APPROACHABLE": "playful approachable cute friendly fun",
        "SOPHISTICATED_ELEGANT": "sophisticated elegant wealth premium",
      };
      const forcedPrompt = archetypeSignals[archetypeKey] || syntheticPrompt;
      return deriveArtDirection(forcedPrompt);
    }

    return artDirection;
  }

  /**
   * Assembles the full ProductDesignBrief from all inputs.
   * This is the single function that produces the locked mandate for the coder.
   *
   * @param characteristics  From ProductUnderstanding.analyze()
   * @param featurePriority  From CapabilityPlanner.plan()
   * @param canonicalSpec    The full project specification (for provenance hash)
   * @param rawPrompt        The original user prompt (for provenance hash)
   * @param selectionMode    How the design was selected
   * @param modeHint         Optional tone hint from --design-mode
   */
  static direct(
    characteristics: ProductCharacteristics,
    featurePriority: FeaturePriority,
    canonicalSpec: object,
    rawPrompt: string,
    selectionMode: DesignSelectionMode = "AUTO",
    modeHint?: string,
  ): ProductDesignBrief {
    const seed = computeDeterministicHash(rawPrompt.trim());

    // [1] Select art direction from characteristics
    const artDirection = DesignDirector.selectArtDirection(characteristics, seed, modeHint);
    const artDirectionName = artDirection.archetype;
    const artDirectionRationale = buildRationale(characteristics, artDirectionName, modeHint);

    // [2] Derive chart palette
    const chartPalette = deriveChartPalette(artDirection);

    // [3] Color system from art direction
    const cs = artDirection.colorSystem;
    const colorSystem: ProductDesignBrief["colorSystem"] = {
      background:   cs.background,
      surface:      cs.surface,
      surfaceRaised: cs.surfaceElevated,
      primary:      cs.primaryHex,
      primaryHover: cs.primaryHoverHex,
      primarySubtle: cs.primarySubtle,
      secondary:    cs.secondaryHex,
      accent:       cs.accentGradient,
      textPrimary:  cs.textPrimary,
      textSecondary: cs.textSecondary,
      textMuted:    cs.textMuted,
      border:       cs.border,
      borderSubtle: cs.borderSubtle,
      success:      cs.success,
      warning:      cs.warning,
      danger:       cs.danger,
      chartPalette,
    };

    // [4] Typography from art direction
    const typ = artDirection.typography;
    const typography: ProductDesignBrief["typography"] = {
      displayFont: typ.fontDisplay,
      bodyFont:    typ.fontBody,
      monoFont:    "JetBrains Mono, monospace",
      headingStyle: typ.headingStyle,
      bodyStyle:   typ.bodyStyle,
      labelStyle:  "text-xs font-medium uppercase tracking-wide",
      displayScale:
        characteristics.informationDensity === "dense" ? "compact" :
        characteristics.informationDensity === "minimal" ? "large" : "medium",
    };

    // [5] Geometry from art direction
    const geo = artDirection.geometry;
    const archetypeStyle = geo.style === "curved" ? "organic" :
                           geo.style === "sharp" ? "sharp" :
                           geo.style === "soft" ? "soft" : "refined";

    const geometry: ProductDesignBrief["geometry"] = {
      style:      archetypeStyle,
      radiusSm:   geo.radiusSm,
      radiusMd:   geo.radiusMd,
      radiusLg:   geo.radiusLg,
      radiusXl:   geo.radiusXl,
      radiusFull: geo.radiusFull,
      borderWidth: artDirectionName.includes("INDUSTRIAL") || artDirectionName.includes("OBSIDIAN") ? "hairline" :
                   artDirectionName.includes("PLAYFUL") ? "thick" : "standard",
      shadowStyle: artDirection.surfaceTreatment.type === "soft_floating" ? "floating" :
                   artDirection.surfaceTreatment.type === "translucent_glass" ? "glow" :
                   artDirection.surfaceTreatment.type === "flat_ruled" ? "flat" : "flat",
    };

    // [6] Motion
    const motion = resolveMotion(characteristics);

    // [7] Visual language
    const visualLanguage = resolveVisualLanguage(characteristics, artDirectionName);

    // [8] Navigation
    const navigation = resolveNavigationStrategy(characteristics, featurePriority);

    // [9] Page compositions
    const pages = featurePriority.informationArchitecture.pages;
    const pageCompositions = pages.map(page => {
      const family = COMPOSITION_FAMILY_MAP[page.heroElement] || "DASHBOARD";
      return {
        route: page.route,
        name: page.name,
        primaryFocus: page.primaryFocus,
        heroElement: page.heroElement,
        secondaryElements: page.supportingElements,
        tertiaryElements: [],
        compositionFamily: family,
        visualRhythm: VISUAL_RHYTHM_BY_FAMILY[family],
        forbiddenPatterns: FORBIDDEN_PATTERNS_BY_FAMILY[family],
        vocabularyContext: VOCABULARY_BY_FAMILY[family],
      };
    });

    // [10] Component language
    const emptyStateCopy = buildEmptyStateCopy(pages, characteristics);
    const componentLanguage: ProductDesignBrief["componentLanguage"] = {
      cardStyle: `${geo.radiusMd} radius, ${artDirection.surfaceTreatment.cardShadow} shadow, ${artDirection.surfaceTreatment.cardBorder} border`,
      buttonPrimary: `bg-[${cs.primaryHex}] hover:bg-[${cs.primaryHoverHex}] text-white rounded-[${geo.radiusMd}] font-medium`,
      buttonSecondary: `bg-transparent border border-[${cs.border}] hover:border-[${cs.primaryHex}] rounded-[${geo.radiusMd}]`,
      inputStyle: `bg-[${cs.surface}] border border-[${cs.border}] rounded-[${geo.radiusMd}] focus:border-[${cs.primaryHex}]`,
      badgeStyle: `bg-[${cs.primaryHex}]/15 text-[${cs.primaryHex}] border border-[${cs.primaryHex}]/30 rounded-full text-xs font-medium`,
      emptyStateCopy,
      loadingStyle: artDirectionName.includes("INDUSTRIAL") || artDirectionName.includes("OBSIDIAN") ? "spinner" : "skeleton",
      chartStyle: `Use all 6 chartPalette colors. No single-color opacity variants. ${artDirectionName.includes("INDUSTRIAL") ? "Monochrome bar charts" : "Full hue range line + area charts"}.`,
    };

    // [11] Design principles (from experience pattern + tone)
    const designPrinciples = buildDesignPrinciples(characteristics);

    // [12] Global forbidden patterns
    const globalForbiddenPatterns = buildGlobalForbiddenPatterns(characteristics);

    // [13] Brief metadata (provenance)
    const generationId = randomUUID();
    const promptHash = sha256(rawPrompt.trim());
    const canonicalSpecHash = sha256(JSON.stringify(canonicalSpec));
    const briefId = `brief_${seed.toString(16)}_${generationId.slice(0, 8)}`;

    return {
      briefId,
      briefVersion: "1.0",
      seed,
      selectionMode,
      briefMetadata: {
        generationId,
        promptHash,
        canonicalSpecHash,
        createdAt: new Date().toISOString(),
      },
      provenanceHash: promptHash,
      compositionBrief: {
        heroElement: pageCompositions[0]?.heroElement || "large-interaction",
        compositionFamily: pageCompositions[0]?.compositionFamily || "DASHBOARD",
      },
      productCharacteristics: characteristics,
      featurePriority,
      artDirectionName,
      artDirectionRationale,
      colorSystem,
      typography,
      geometry,
      motion,
      visualLanguage,
      navigation,
      componentLanguage,
      pageCompositions,
      designPrinciples,
      vocabularyContract: characteristics.vocabularyContract,
      vocabularyConstraints: characteristics.vocabularyContract,
      globalForbiddenPatterns,
    };
  }
}

// ─── CALM_BOTANICAL archetype (new — added by Design Director plan) ───────────

function buildCalmBotanicalContract(seed: number): VisualArtDirectionContract {
  // Sage / terracotta / marigold on ivory — a calm, light botanical identity
  // For personal trackers with calm/warm emotional tone
  const variants = [
    { name: "sage",       hex: "#5b7f6e", hoverHex: "#4a6b5b", subtle: "rgba(91, 127, 110, 0.14)", gradient: "from-[#5b7f6e] to-[#8ab5a1]" },
    { name: "terracotta", hex: "#c4734a", hoverHex: "#a85c37", subtle: "rgba(196, 115, 74, 0.14)", gradient: "from-[#c4734a] to-[#e8a882]" },
    { name: "marigold",   hex: "#d4a017", hoverHex: "#b88a10", subtle: "rgba(212, 160, 23, 0.14)", gradient: "from-[#d4a017] to-[#f0c84a]" },
  ];
  const variant = variants[Math.abs(seed) % variants.length];

  return {
    id: `vad_calm_botanical_${seed.toString(16)}`,
    name: `CALM BOTANICAL (${variant.name})`,
    archetype: "CALM_BOTANICAL" as any, // extended archetype
    colorSystem: {
      mode: "light",
      background: "#f9f6f1",         // warm ivory
      surface: "#ffffff",
      surfaceElevated: "#f3ede4",    // warm cream
      primary: variant.name,
      primaryHex: variant.hex,
      primaryHoverHex: variant.hoverHex,
      primarySubtle: variant.subtle,
      secondary: "stone",
      secondaryHex: "#8a7968",
      accentGradient: variant.gradient,
      textPrimary: "#2d2420",        // deep warm brown
      textSecondary: "#5a4e44",
      textMuted: "#8a7968",
      border: "rgba(91, 127, 110, 0.15)",
      borderSubtle: "rgba(91, 127, 110, 0.07)",
      success: "#5b7f6e",
      warning: "#d4a017",
      danger: "#c4734a",
      badgeStyle: `bg-[${variant.hex}]/15 text-[${variant.hex}] border border-[${variant.hex}]/30`,
      activeNavStyle: `bg-[${variant.hex}]/12 text-[${variant.hex}] border-l-2 border-[${variant.hex}]`,
      tailwindBgClass: "bg-[#f9f6f1]",
      tailwindSurfaceClass: "bg-white border-[#5b7f6e]/15",
      tailwindCardClass: "bg-white border border-[#5b7f6e]/15 shadow-sm shadow-[#5b7f6e]/5",
    },
    geometry: {
      style: "soft",
      radiusSm: "6px",
      radiusMd: "12px",
      radiusLg: "20px",
      radiusXl: "28px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "soft_floating",
      backdropBlur: "0px",
      cardShadow: "0 4px 16px -2px rgba(91, 127, 110, 0.10), 0 1px 4px -1px rgba(0,0,0,0.04)",
      cardBorder: "1px solid rgba(91, 127, 110, 0.15)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Outfit, Plus Jakarta Sans, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-[#2d2420]",
      bodyStyle: "text-sm text-[#5a4e44] leading-relaxed",
      emphasis: `font-semibold text-[${variant.hex}]`,
    },
    navigation: { style: "TOPBAR_PILL" },
    spacing: { density: "spacious" },
    semanticPersonality: {
      tone: "calm",
      compositionPreference: "EDITORIAL_LANDING",
      cardEnclosureStyle: "borderless",
    },
    layoutPersonality: {
      family: "EDITORIAL_LANDING",
      mood: "Calm botanical sanctuary — warm ivory surfaces, natural sage and terracotta accents, generous breathing room",
      motifs: ["organic_leaf_motifs", "soft_pill_chips", "warm_surface_texture"],
    },
  };
}

// ─── Design principles & forbidden patterns ───────────────────────────────────

function buildDesignPrinciples(characteristics: ProductCharacteristics): string[] {
  const principles: string[] = [
    "Every visual component must be traceable to the ProductDesignBrief",
    "The coder implements — does not design",
    `Use ${characteristics.experiencePattern} composition patterns, not generic card grids`,
  ];

  if (characteristics.audienceContext.isPersonal) {
    principles.push("Primary daily action must be the largest element on the home screen");
    principles.push("Progress and streaks must be immediately visible without scrolling");
  }

  if (characteristics.isDataDriven) {
    principles.push("All 6 chartPalette colors must be used across charts — not 1 color with opacity variants");
    principles.push("Data visualizations are primary content, not decorative elements");
  }

  if (characteristics.emotionalTone.primary === "calm" || characteristics.emotionalTone.primary === "warm") {
    principles.push("Breathing room is a feature — generous padding and whitespace are intentional");
    principles.push("Avoid dense data tables on personal pages");
  }

  principles.push(`Navigation must use ${characteristics.experiencePattern === "personal-tracker" ? "bottom tab" : "top"} strategy with ≤ 5 primary items`);

  return principles;
}

function buildGlobalForbiddenPatterns(characteristics: ProductCharacteristics): string[] {
  const forbidden: string[] = [
    "Generic blue-purple gradient hero on every page",
    "Uniform KPI card grid as homepage hero (unless operations-dashboard experience pattern)",
    "Navigation with > 5 primary items",
    "Color-only information encoding (always pair with text/icon)",
    "Placeholder text 'No data', 'Nothing here', 'No results found' — use contextual empty states",
  ];

  if (characteristics.audienceContext.isPersonal) {
    forbidden.push("Admin-style data tables as the primary homepage element");
    forbidden.push("Sidebar navigation for a personal mobile-first app");
    forbidden.push("Bulk action checkboxes on personal tracker pages");
  }

  if (characteristics.emotionalTone.primary === "calm") {
    forbidden.push("Bright alert-red or high-saturation neon accents as primary color");
    forbidden.push("Dense information without visual breathing room");
  }

  if (characteristics.experiencePattern === "personal-tracker") {
    forbidden.push("Registry, Inspect, Record ID, Manage Records in any label, heading, or button");
    forbidden.push("Delete Record as a primary CTA");
  }

  return forbidden;
}

// ─── DesignBriefLock class ────────────────────────────────────────────────────

const BRIEF_FILE = "design-brief.json";
const BRIEF_HASH_FILE = "design-brief.sha256";
const AEGIS_DIR = ".aegis";

export class DesignBriefLock {
  /**
   * Writes design-brief.json + design-brief.sha256 to <outputDirectory>/.aegis/
   * Idempotent: safe to call multiple times (overwrites previous brief).
   */
  static write(brief: ProductDesignBrief, outputDirectory: string): void {
    const aegisDir = join(outputDirectory, AEGIS_DIR);
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const content = JSON.stringify(brief, null, 2);
    const hash = sha256(content);

    writeFileSync(join(aegisDir, BRIEF_FILE), content, "utf8");
    writeFileSync(join(aegisDir, BRIEF_HASH_FILE), hash, "utf8");
  }

  /**
   * Reads and verifies the design brief.
   * Throws structured errors on integrity failures — never returns a corrupt brief.
   *
   * @param outputDirectory     Project output directory
   * @param currentPrompt       If provided, verifies promptHash matches
   * @param currentCanonicalSpec If provided, verifies canonicalSpecHash matches
   */
  static verify(
    outputDirectory: string,
    currentPrompt?: string,
    currentCanonicalSpec?: object,
  ): ProductDesignBrief {
    const aegisDir = join(outputDirectory, AEGIS_DIR);
    const briefPath = join(aegisDir, BRIEF_FILE);
    const hashPath = join(aegisDir, BRIEF_HASH_FILE);

    if (!existsSync(briefPath)) {
      throw new Error(`DESIGN_BRIEF_MISSING: No design brief found at ${briefPath}. Run DesignDirector.direct() first.`);
    }

    const content = readFileSync(briefPath, "utf8");
    const storedHash = existsSync(hashPath) ? readFileSync(hashPath, "utf8").trim() : null;

    // [1] Integrity check — brief was not mutated on disk
    if (storedHash) {
      const actualHash = sha256(content);
      if (actualHash !== storedHash) {
        throw new Error(
          `DESIGN_BRIEF_MUTATED: The design brief at ${briefPath} has been modified after it was locked. ` +
          `Expected SHA-256: ${storedHash}. Actual: ${actualHash}. ` +
          `Do not manually edit .aegis/design-brief.json.`
        );
      }
    }

    const brief: ProductDesignBrief = JSON.parse(content);

    // [2] Prompt provenance check — brief is from the same prompt
    if (currentPrompt) {
      const expectedPromptHash = sha256(currentPrompt.trim());
      if (brief.briefMetadata.promptHash !== expectedPromptHash) {
        throw new Error(
          `DESIGN_BRIEF_STALE_PROMPT: The locked design brief was generated from a different prompt. ` +
          `Brief generationId: ${brief.briefMetadata.generationId}. ` +
          `Stored promptHash: ${brief.briefMetadata.promptHash}. ` +
          `Current promptHash: ${expectedPromptHash}. ` +
          `Delete .aegis/design-brief.json and regenerate.`
        );
      }
    }

    // [3] Spec provenance check — brief is from the same spec
    if (currentCanonicalSpec) {
      const expectedSpecHash = sha256(JSON.stringify(currentCanonicalSpec));
      if (brief.briefMetadata.canonicalSpecHash !== expectedSpecHash) {
        throw new Error(
          `DESIGN_BRIEF_STALE_SPEC: The locked design brief was generated from a different specification. ` +
          `Brief generationId: ${brief.briefMetadata.generationId}. ` +
          `Delete .aegis/design-brief.json and regenerate.`
        );
      }
    }

    return brief;
  }

  /**
   * Reads the design brief without provenance verification.
   * Use verify() whenever possible. Use read() only for post-generation inspection.
   */
  static read(outputDirectory: string): ProductDesignBrief {
    return DesignBriefLock.verify(outputDirectory);
  }
}
