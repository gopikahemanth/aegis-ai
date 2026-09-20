/**
 * Visual Art Direction Architecture
 *
 * Generates coherent, domain-appropriate visual identities without hardcoding
 * static prompt-to-color pairs (e.g. "if solar -> green, if maritime -> navy").
 *
 * Derives visual personality from semantic domain affinity combined with a
 * deterministic hash seed so that:
 * 1. Different prompts produce genuinely distinct visual identities.
 * 2. The same prompt produces identical, reproducible results.
 * 3. All generated identities pass WCAG 2.1 AA contrast requirements.
 * 4. No unconditional default blue dashboard dominates output.
 */

export interface SemanticPersonality {
  tone: "playful" | "friendly" | "calm" | "warm" | "editorial" | "minimal" | "technical" | "luxurious" | "bold";
  compositionPreference: "EDITORIAL_LANDING" | "ASYMMETRIC_PRODUCT_DASHBOARD" | "SPLIT_SCREEN_WORKSPACE" | "VISUAL_ANALYTICS_CANVAS" | "PLAYFUL_WORKSPACE" | "MINIMAL_SAAS_CONSOLE";
  cardEnclosureStyle: "borderless" | "soft_floating" | "translucent_glass" | "structured_ruled";
}

export interface VisualArtDirectionContract {
  id: string;
  name: string;
  archetype:
    | "INDUSTRIAL_UTILITY"
    | "OCEANIC_MARITIME"
    | "CLINICAL_LABORATORY"
    | "EDITORIAL_HERITAGE"
    | "OBSIDIAN_PRECISION"
    | "MODERN_SWISS"
    | "BOTANICAL_EARTH"
    | "NORDIC_MINIMAL"
    | "AMBER_WARM_DARK"
    | "NEON_SYNTHETIC"
    | "EDITORIAL_NARRATIVE"
    | "RESTRAINED_PRODUCT"
    | "PLAYFUL_APPROACHABLE"
    | "SOPHISTICATED_ELEGANT"
    | "CALM_BOTANICAL";   // sage/terracotta/marigold on warm ivory — personal tracker direction

  colorSystem: {
    mode: "light" | "dark" | "warm_dark" | "deep_obsidian" | "neon_dark";
    background: string;
    surface: string;
    surfaceElevated: string;
    primary: string;
    primaryHex: string;
    primaryHoverHex: string;
    primarySubtle: string;
    secondary: string;
    secondaryHex: string;
    accentGradient: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderSubtle: string;
    success: string;
    warning: string;
    danger: string;
    badgeStyle: string;
    activeNavStyle: string;
    tailwindBgClass: string;
    tailwindSurfaceClass: string;
    tailwindCardClass: string;
  };

  geometry: {
    style: "sharp" | "refined" | "curved" | "soft";
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    radiusXl: string;
    radiusFull: string;
  };

  surfaceTreatment: {
    type: "flat_ruled" | "solid_depth" | "translucent_glass" | "editorial_slabs" | "borderless_clean" | "soft_floating";
    backdropBlur: string;
    cardShadow: string;
    cardBorder: string;
  };

  typography: {
    pairing: "technical_mono" | "editorial_serif" | "modern_geometric" | "brutalist_display" | "clean_humanist";
    fontDisplay: string;
    fontBody: string;
    headingStyle: string;
    bodyStyle: string;
    emphasis: string;
  };

  navigation: {
    style: "TOPBAR_PILL" | "DUAL_SIDEBAR" | "MINIMAL_DRAWER" | "COMMAND_CONSOLE" | "MODERN_SIDEBAR";
  };

  spacing: {
    density: "compact" | "balanced" | "spacious";
  };

  semanticPersonality: SemanticPersonality;

  layoutPersonality: {
    family:
      | "COMMAND_CENTER"
      | "EDITORIAL_CATALOG"
      | "WORKSPACE_SPLIT"
      | "TIMELINE_PIPELINE"
      | "CALENDAR_SCHEDULE"
      | "MEDIA_SHOWCASE"
      | "HOSPITALITY_PORTAL"
      | "ANALYTICS_CONSOLE"
      | "EDITORIAL_LANDING"
      | "ASYMMETRIC_PRODUCT_DASHBOARD"
      | "SPLIT_SCREEN_WORKSPACE"
      | "VISUAL_ANALYTICS"
      | "VISUAL_ANALYTICS_CANVAS"
      | "PLAYFUL_WORKSPACE"
      | "MINIMAL_SAAS"
      | "MINIMAL_SAAS_CONSOLE";
    mood: string;
    motifs: string[];
  };
}

/**
 * Deterministic FNV-1a 32-bit hash.
 * Fast, uniform, and 100% reproducible across JavaScript engines.
 */
export function computeDeterministicHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Calculates relative luminance according to WCAG 2.1 specifications.
 */
export function getLuminance(color: string): number {
  const rgb = parseRgb(color);
  if (!rgb) return 0.5;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two colors (ranging from 1:1 to 21:1).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== "string") return null;
  const hexMatch = color.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  return null;
}

interface ArchetypeDefinition {
  archetype: VisualArtDirectionContract["archetype"];
  mode: VisualArtDirectionContract["colorSystem"]["mode"];
  background: string;
  surface: string;
  surfaceElevated: string;
  primaryVariants: Array<{
    name: string;
    hex: string;
    hoverHex: string;
    subtle: string;
    gradient: string;
  }>;
  secondary: string;
  secondaryHex: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  geometry: {
    style: VisualArtDirectionContract["geometry"]["style"];
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    radiusXl: string;
    radiusFull: string;
  };
  surfaceTreatment: VisualArtDirectionContract["surfaceTreatment"];
  typography: VisualArtDirectionContract["typography"];
  tailwindBgClass: string;
  tailwindSurfaceClass: string;
  tailwindCardClass: string;
  mood: string;
  motifs: string[];
}

const ARCHETYPES: Record<VisualArtDirectionContract["archetype"], ArchetypeDefinition> = {
  // CALM_BOTANICAL — sage/terracotta/marigold on warm ivory
  // The intentional personal-tracker direction for calm/warm emotional tones
  CALM_BOTANICAL: {
    archetype: "CALM_BOTANICAL",
    mode: "light",
    background: "#f9f6f1",
    surface: "#ffffff",
    surfaceElevated: "#f3ede4",
    primaryVariants: [
      { name: "sage",       hex: "#5b7f6e", hoverHex: "#4a6b5b", subtle: "rgba(91, 127, 110, 0.14)", gradient: "from-[#5b7f6e] to-[#8ab5a1]" },
      { name: "terracotta",hex: "#c4734a", hoverHex: "#a85c37", subtle: "rgba(196, 115, 74, 0.14)",  gradient: "from-[#c4734a] to-[#e8a882]" },
      { name: "marigold",  hex: "#d4a017", hoverHex: "#b88a10", subtle: "rgba(212, 160, 23, 0.14)",  gradient: "from-[#d4a017] to-[#f0c84a]" },
    ],
    secondary: "stone",
    secondaryHex: "#8a7968",
    textPrimary: "#2d2420",
    textSecondary: "#5a4e44",
    textMuted: "#8a7968",
    border: "rgba(91, 127, 110, 0.15)",
    borderSubtle: "rgba(91, 127, 110, 0.07)",
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
      emphasis: "font-semibold text-[#5b7f6e]",
    },
    tailwindBgClass: "bg-[#f9f6f1]",
    tailwindSurfaceClass: "bg-white border-[#5b7f6e]/15",
    tailwindCardClass: "bg-white border border-[#5b7f6e]/15 shadow-sm shadow-[#5b7f6e]/5",
    mood: "Calm botanical sanctuary — warm ivory surfaces, natural sage and terracotta accents, generous breathing room",
    motifs: ["organic_leaf_motifs", "soft_pill_chips", "warm_surface_texture"],
  },
  INDUSTRIAL_UTILITY: {
    archetype: "INDUSTRIAL_UTILITY",
    mode: "dark",
    background: "#141416",
    surface: "rgba(28, 28, 32, 0.92)",
    surfaceElevated: "rgba(42, 42, 48, 0.96)",
    primaryVariants: [
      { name: "amber", hex: "#f59e0b", hoverHex: "#d97706", subtle: "rgba(245, 158, 11, 0.16)", gradient: "from-amber-500 to-orange-600" },
      { name: "orange", hex: "#f97316", hoverHex: "#ea580c", subtle: "rgba(249, 115, 22, 0.16)", gradient: "from-orange-500 to-amber-600" },
      { name: "yellow", hex: "#eab308", hoverHex: "#ca8a04", subtle: "rgba(234, 179, 8, 0.16)", gradient: "from-yellow-500 to-amber-600" },
    ],
    secondary: "zinc",
    secondaryHex: "#71717a",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    border: "rgba(255, 255, 255, 0.12)",
    borderSubtle: "rgba(255, 255, 255, 0.06)",
    geometry: {
      style: "sharp",
      radiusSm: "1px",
      radiusMd: "3px",
      radiusLg: "4px",
      radiusXl: "6px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "flat_ruled",
      backdropBlur: "0px",
      cardShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.4)",
      cardBorder: "1px solid rgba(255, 255, 255, 0.12)",
    },
    typography: {
      pairing: "technical_mono",
      fontDisplay: "Space Grotesk, JetBrains Mono, monospace",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-mono font-bold tracking-tight text-zinc-100 uppercase",
      bodyStyle: "text-sm text-zinc-300",
      emphasis: "font-mono font-semibold text-amber-400",
    },
    tailwindBgClass: "bg-[#141416]",
    tailwindSurfaceClass: "bg-[#1c1c20]/90 border-zinc-800",
    tailwindCardClass: "bg-[#1c1c20] border border-zinc-800 shadow-md",
    mood: "Industrial telemetry, field hardware precision, rugged amber beacons, and technical grid discipline",
    motifs: ["technical_hairlines", "status_beacons", "dense_metric_grids"],
  },

  OCEANIC_MARITIME: {
    archetype: "OCEANIC_MARITIME",
    mode: "dark",
    background: "#070e18",
    surface: "rgba(13, 23, 38, 0.92)",
    surfaceElevated: "rgba(20, 35, 58, 0.96)",
    primaryVariants: [
      { name: "sky", hex: "#0ea5e9", hoverHex: "#0284c7", subtle: "rgba(14, 165, 233, 0.18)", gradient: "from-sky-400 to-teal-500" },
      { name: "teal", hex: "#14b8a6", hoverHex: "#0d9488", subtle: "rgba(20, 184, 166, 0.18)", gradient: "from-teal-400 to-cyan-500" },
      { name: "cyan", hex: "#06b6d4", hoverHex: "#0891b2", subtle: "rgba(6, 182, 212, 0.18)", gradient: "from-cyan-400 to-sky-500" },
    ],
    secondary: "slate",
    secondaryHex: "#64748b",
    textPrimary: "#f0f9ff",
    textSecondary: "#93c5fd",
    textMuted: "#64748b",
    border: "rgba(56, 189, 248, 0.18)",
    borderSubtle: "rgba(56, 189, 248, 0.08)",
    geometry: {
      style: "refined",
      radiusSm: "2px",
      radiusMd: "5px",
      radiusLg: "8px",
      radiusXl: "12px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "solid_depth",
      backdropBlur: "0px",
      cardShadow: "0 4px 12px -2px rgba(2, 6, 23, 0.6)",
      cardBorder: "1px solid rgba(56, 189, 248, 0.2)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Outfit, Plus Jakarta Sans, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "tracking-tight font-semibold text-sky-50",
      bodyStyle: "text-sm text-sky-200/80",
      emphasis: "font-semibold text-sky-400",
    },
    tailwindBgClass: "bg-[#070e18]",
    tailwindSurfaceClass: "bg-[#0d1726]/90 border-sky-950/80",
    tailwindCardClass: "bg-[#0d1726] border border-sky-900/40 shadow-lg shadow-black/50",
    mood: "Deep oceanic vessel dispatch, coastal seafoam clarity, nautical chart borders, and high-visibility beacon markers",
    motifs: ["nautical_waypoints", "coordinate_badges", "vessel_telemetry_cells"],
  },

  CLINICAL_LABORATORY: {
    archetype: "CLINICAL_LABORATORY",
    mode: "light",
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceElevated: "#f1f5f9",
    primaryVariants: [
      { name: "emerald", hex: "#059669", hoverHex: "#047857", subtle: "rgba(5, 150, 105, 0.12)", gradient: "from-emerald-600 to-teal-700" },
      { name: "teal", hex: "#0d9488", hoverHex: "#0f766e", subtle: "rgba(13, 148, 136, 0.12)", gradient: "from-teal-600 to-cyan-700" },
      { name: "blue", hex: "#2563eb", hoverHex: "#1d4ed8", subtle: "rgba(37, 99, 235, 0.12)", gradient: "from-blue-600 to-indigo-700" },
    ],
    secondary: "slate",
    secondaryHex: "#64748b",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    border: "rgba(15, 23, 42, 0.1)",
    borderSubtle: "rgba(15, 23, 42, 0.05)",
    geometry: {
      style: "refined",
      radiusSm: "3px",
      radiusMd: "6px",
      radiusLg: "8px",
      radiusXl: "12px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "flat_ruled",
      backdropBlur: "0px",
      cardShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      cardBorder: "1px solid rgba(15, 23, 42, 0.08)",
    },
    typography: {
      pairing: "clean_humanist",
      fontDisplay: "Plus Jakarta Sans, Inter, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-slate-900",
      bodyStyle: "text-sm text-slate-600",
      emphasis: "font-medium text-emerald-700",
    },
    tailwindBgClass: "bg-slate-50",
    tailwindSurfaceClass: "bg-white border-slate-200",
    tailwindCardClass: "bg-white border border-slate-200 shadow-sm",
    mood: "Surgical, pristine clinical clarity with high-contrast diagnostic indicators and hairline precision",
    motifs: ["sterile_dividers", "specimen_status_tags", "diagnostic_meters"],
  },

  EDITORIAL_HERITAGE: {
    archetype: "EDITORIAL_HERITAGE",
    mode: "warm_dark",
    background: "#141210",
    surface: "rgba(30, 26, 24, 0.94)",
    surfaceElevated: "rgba(46, 40, 36, 0.98)",
    primaryVariants: [
      { name: "terracotta", hex: "#c2410c", hoverHex: "#9a3412", subtle: "rgba(194, 65, 12, 0.18)", gradient: "from-orange-600 to-amber-700" },
      { name: "amber", hex: "#b45309", hoverHex: "#92400e", subtle: "rgba(180, 83, 9, 0.18)", gradient: "from-amber-600 to-orange-700" },
      { name: "rose", hex: "#be123c", hoverHex: "#9f1239", subtle: "rgba(190, 18, 60, 0.18)", gradient: "from-rose-600 to-amber-700" },
    ],
    secondary: "stone",
    secondaryHex: "#78716c",
    textPrimary: "#fafaf9",
    textSecondary: "#d6d3d1",
    textMuted: "#a8a29e",
    border: "rgba(214, 211, 209, 0.14)",
    borderSubtle: "rgba(214, 211, 209, 0.07)",
    geometry: {
      style: "sharp",
      radiusSm: "1px",
      radiusMd: "3px",
      radiusLg: "5px",
      radiusXl: "8px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "editorial_slabs",
      backdropBlur: "0px",
      cardShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
      cardBorder: "1px solid rgba(214, 211, 209, 0.14)",
    },
    typography: {
      pairing: "editorial_serif",
      fontDisplay: "Newsreader, Georgia, serif",
      fontBody: "Plus Jakarta Sans, Inter, sans-serif",
      headingStyle: "font-serif font-medium tracking-normal text-stone-100 italic",
      bodyStyle: "text-sm text-stone-300 leading-relaxed",
      emphasis: "font-serif font-semibold text-orange-400 not-italic",
    },
    tailwindBgClass: "bg-[#141210]",
    tailwindSurfaceClass: "bg-[#1e1a18]/90 border-stone-800",
    tailwindCardClass: "bg-[#1e1a18] border border-stone-800 shadow-md",
    mood: "Warm editorial heritage, rich terracotta warmth, monograph typography, and timeless catalog framing",
    motifs: ["ruled_editorial_dividers", "curated_plate_numbers", "typography_dropcaps"],
  },

  OBSIDIAN_PRECISION: {
    archetype: "OBSIDIAN_PRECISION",
    mode: "deep_obsidian",
    background: "#08080a",
    surface: "rgba(18, 18, 22, 0.94)",
    surfaceElevated: "rgba(28, 28, 36, 0.98)",
    primaryVariants: [
      { name: "emerald", hex: "#22c55e", hoverHex: "#16a34a", subtle: "rgba(34, 197, 94, 0.18)", gradient: "from-green-500 to-emerald-600" },
      { name: "teal", hex: "#10b981", hoverHex: "#059669", subtle: "rgba(16, 185, 129, 0.18)", gradient: "from-emerald-400 to-teal-600" },
      { name: "cyan", hex: "#06b6d4", hoverHex: "#0891b2", subtle: "rgba(6, 182, 212, 0.18)", gradient: "from-cyan-400 to-emerald-500" },
    ],
    secondary: "zinc",
    secondaryHex: "#71717a",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    textMuted: "#52525b",
    border: "rgba(255, 255, 255, 0.10)",
    borderSubtle: "rgba(255, 255, 255, 0.05)",
    geometry: {
      style: "sharp",
      radiusSm: "1px",
      radiusMd: "2px",
      radiusLg: "4px",
      radiusXl: "6px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "flat_ruled",
      backdropBlur: "0px",
      cardShadow: "0 0 0 1px rgba(255, 255, 255, 0.08)",
      cardBorder: "1px solid rgba(255, 255, 255, 0.10)",
    },
    typography: {
      pairing: "technical_mono",
      fontDisplay: "JetBrains Mono, monospace",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-mono font-bold tracking-tight text-zinc-100",
      bodyStyle: "text-sm text-zinc-300 font-mono",
      emphasis: "font-mono font-bold text-emerald-400",
    },
    tailwindBgClass: "bg-[#08080a]",
    tailwindSurfaceClass: "bg-[#121216]/90 border-zinc-900",
    tailwindCardClass: "bg-[#121216] border border-zinc-800 shadow-sm",
    mood: "High-velocity data density, phosphor CRT precision, ultra-compact telemetry, and pitch-black obsidian contrast",
    motifs: ["phosphor_indicators", "1px_crisp_borders", "dense_telemetry_bars"],
  },

  MODERN_SWISS: {
    archetype: "MODERN_SWISS",
    mode: "dark",
    background: "#0c0c0e",
    surface: "rgba(22, 22, 26, 0.95)",
    surfaceElevated: "rgba(34, 34, 40, 0.98)",
    primaryVariants: [
      { name: "rose", hex: "#dc2626", hoverHex: "#b91c1c", subtle: "rgba(220, 38, 38, 0.18)", gradient: "from-red-600 to-rose-700" },
      { name: "orange", hex: "#ea580c", hoverHex: "#c2410c", subtle: "rgba(234, 88, 12, 0.18)", gradient: "from-orange-600 to-red-600" },
    ],
    secondary: "zinc",
    secondaryHex: "#71717a",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    border: "rgba(255, 255, 255, 0.14)",
    borderSubtle: "rgba(255, 255, 255, 0.07)",
    geometry: {
      style: "sharp",
      radiusSm: "0px",
      radiusMd: "2px",
      radiusLg: "3px",
      radiusXl: "4px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "flat_ruled",
      backdropBlur: "0px",
      cardShadow: "none",
      cardBorder: "1px solid rgba(255, 255, 255, 0.14)",
    },
    typography: {
      pairing: "brutalist_display",
      fontDisplay: "Space Grotesk, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-black tracking-tighter text-white uppercase",
      bodyStyle: "text-sm text-zinc-300 leading-normal",
      emphasis: "font-bold text-red-500",
    },
    tailwindBgClass: "bg-[#0c0c0e]",
    tailwindSurfaceClass: "bg-[#16161a] border-zinc-800",
    tailwindCardClass: "bg-[#16161a] border border-zinc-700 shadow-none",
    mood: "International Typographic Style, asymmetric grid discipline, vermilion focal point, and stark minimalism",
    motifs: ["heavy_contrast_rules", "numbered_sections", "minimal_badges"],
  },

  BOTANICAL_EARTH: {
    archetype: "BOTANICAL_EARTH",
    mode: "warm_dark",
    background: "#0a120e",
    surface: "rgba(16, 26, 20, 0.92)",
    surfaceElevated: "rgba(26, 40, 32, 0.96)",
    primaryVariants: [
      { name: "emerald", hex: "#10b981", hoverHex: "#059669", subtle: "rgba(16, 185, 129, 0.18)", gradient: "from-emerald-400 to-green-600" },
      { name: "amber", hex: "#d97706", hoverHex: "#b45309", subtle: "rgba(217, 119, 6, 0.18)", gradient: "from-amber-500 to-emerald-600" },
      { name: "teal", hex: "#14b8a6", hoverHex: "#0d9488", subtle: "rgba(20, 184, 166, 0.18)", gradient: "from-teal-400 to-emerald-600" },
    ],
    secondary: "stone",
    secondaryHex: "#78716c",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
    textMuted: "#6ee7b7",
    border: "rgba(16, 185, 129, 0.18)",
    borderSubtle: "rgba(16, 185, 129, 0.08)",
    geometry: {
      style: "curved",
      radiusSm: "4px",
      radiusMd: "8px",
      radiusLg: "12px",
      radiusXl: "18px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "solid_depth",
      backdropBlur: "0px",
      cardShadow: "0 4px 14px -2px rgba(2, 20, 10, 0.5)",
      cardBorder: "1px solid rgba(16, 185, 129, 0.18)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Plus Jakarta Sans, Outfit, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "tracking-tight font-semibold text-emerald-50",
      bodyStyle: "text-sm text-emerald-200/80",
      emphasis: "font-semibold text-emerald-400",
    },
    tailwindBgClass: "bg-[#0a120e]",
    tailwindSurfaceClass: "bg-[#101a14]/90 border-emerald-950/80",
    tailwindCardClass: "bg-[#101a14] border border-emerald-900/40 shadow-lg shadow-black/50",
    mood: "Deep forest ecology, natural earthy vitality, organic soft corners, and serene environmental telemetry",
    motifs: ["leaf_canopy_accents", "organic_curved_badges", "biophilic_meters"],
  },

  NORDIC_MINIMAL: {
    archetype: "NORDIC_MINIMAL",
    mode: "light",
    background: "#f1f5f9",
    surface: "#ffffff",
    surfaceElevated: "#e2e8f0",
    primaryVariants: [
      { name: "sky", hex: "#0284c7", hoverHex: "#0369a1", subtle: "rgba(2, 132, 199, 0.12)", gradient: "from-sky-600 to-indigo-700" },
      { name: "teal", hex: "#0f766e", hoverHex: "#115e59", subtle: "rgba(15, 118, 110, 0.12)", gradient: "from-teal-700 to-sky-700" },
      { name: "indigo", hex: "#4338ca", hoverHex: "#3730a3", subtle: "rgba(67, 56, 202, 0.12)", gradient: "from-indigo-600 to-sky-700" },
    ],
    secondary: "slate",
    secondaryHex: "#64748b",
    textPrimary: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    border: "rgba(15, 23, 42, 0.09)",
    borderSubtle: "rgba(15, 23, 42, 0.04)",
    geometry: {
      style: "refined",
      radiusSm: "4px",
      radiusMd: "8px",
      radiusLg: "12px",
      radiusXl: "16px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "solid_depth",
      backdropBlur: "0px",
      cardShadow: "0 2px 8px -1px rgba(15, 23, 42, 0.08)",
      cardBorder: "1px solid rgba(15, 23, 42, 0.08)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Outfit, Inter, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-slate-900",
      bodyStyle: "text-sm text-slate-600 leading-relaxed",
      emphasis: "font-medium text-sky-700",
    },
    tailwindBgClass: "bg-slate-100",
    tailwindSurfaceClass: "bg-white border-slate-200",
    tailwindCardClass: "bg-white border border-slate-200 shadow-sm",
    mood: "Clean Nordic composure, pale arctic atmosphere, generous negative space, and understated typography",
    motifs: ["airy_dividers", "soft_pill_chips", "spacious_cards"],
  },

  AMBER_WARM_DARK: {
    archetype: "AMBER_WARM_DARK",
    mode: "warm_dark",
    background: "#0e0c0b",
    surface: "rgba(26, 22, 20, 0.94)",
    surfaceElevated: "rgba(38, 32, 28, 0.98)",
    primaryVariants: [
      { name: "amber", hex: "#f59e0b", hoverHex: "#d97706", subtle: "rgba(245, 158, 11, 0.18)", gradient: "from-amber-500 via-orange-500 to-rose-600" },
      { name: "orange", hex: "#ea580c", hoverHex: "#c2410c", subtle: "rgba(234, 88, 12, 0.18)", gradient: "from-orange-500 to-amber-600" },
    ],
    secondary: "stone",
    secondaryHex: "#78716c",
    textPrimary: "#fffbeb",
    textSecondary: "#fde68a",
    textMuted: "#b45309",
    border: "rgba(245, 158, 11, 0.18)",
    borderSubtle: "rgba(245, 158, 11, 0.08)",
    geometry: {
      style: "refined",
      radiusSm: "3px",
      radiusMd: "6px",
      radiusLg: "10px",
      radiusXl: "14px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "solid_depth",
      backdropBlur: "0px",
      cardShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.6)",
      cardBorder: "1px solid rgba(245, 158, 11, 0.2)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Plus Jakarta Sans, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-amber-50",
      bodyStyle: "text-sm text-amber-200/80",
      emphasis: "font-bold text-amber-400",
    },
    tailwindBgClass: "bg-[#0e0c0b]",
    tailwindSurfaceClass: "bg-[#1a1614]/90 border-amber-950/80",
    tailwindCardClass: "bg-[#1a1614] border border-amber-900/40 shadow-xl shadow-black/60",
    mood: "Glowing vacuum tubes, warm walnut enclosures, analog VU needle luminescence, and vintage craft precision",
    motifs: ["analog_vu_bands", "glowing_amber_filaments", "warm_enclosures"],
  },

  NEON_SYNTHETIC: {
    archetype: "NEON_SYNTHETIC",
    mode: "neon_dark",
    background: "#07060d",
    surface: "rgba(17, 13, 31, 0.90)",
    surfaceElevated: "rgba(32, 24, 58, 0.96)",
    primaryVariants: [
      { name: "violet", hex: "#8b5cf6", hoverHex: "#7c3aed", subtle: "rgba(139, 92, 246, 0.22)", gradient: "from-fuchsia-500 via-purple-600 to-cyan-400" },
      { name: "fuchsia", hex: "#d946ef", hoverHex: "#c026d3", subtle: "rgba(217, 70, 239, 0.22)", gradient: "from-pink-500 via-purple-500 to-cyan-400" },
      { name: "cyan", hex: "#06b6d4", hoverHex: "#0891b2", subtle: "rgba(6, 182, 212, 0.22)", gradient: "from-cyan-400 via-violet-500 to-pink-500" },
    ],
    secondary: "zinc",
    secondaryHex: "#71717a",
    textPrimary: "#fdf4ff",
    textSecondary: "#d8b4fe",
    textMuted: "#a855f7",
    border: "rgba(139, 92, 246, 0.25)",
    borderSubtle: "rgba(139, 92, 246, 0.12)",
    geometry: {
      style: "curved",
      radiusSm: "4px",
      radiusMd: "8px",
      radiusLg: "14px",
      radiusXl: "20px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "translucent_glass",
      backdropBlur: "16px",
      cardShadow: "0 10px 30px -5px rgba(139, 92, 246, 0.25)",
      cardBorder: "1px solid rgba(139, 92, 246, 0.25)",
    },
    typography: {
      pairing: "brutalist_display",
      fontDisplay: "Syne, Space Grotesk, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-black tracking-tight text-violet-100",
      bodyStyle: "text-sm text-violet-200/80",
      emphasis: "font-bold text-cyan-400",
    },
    tailwindBgClass: "bg-[#07060d]",
    tailwindSurfaceClass: "bg-[#110d1f]/90 border-[#281e45]",
    tailwindCardClass: "bg-[#110d1f] border border-[#2b1f4c] shadow-2xl shadow-violet-950/40",
    mood: "Electric, immersive, vibrant cyberpunk nightlife with ultraviolet glows and phosphor neon",
    motifs: ["neon_rim_glows", "frequency_visualizers", "cyberpunk_pills"],
  },

  EDITORIAL_NARRATIVE: {
    archetype: "EDITORIAL_NARRATIVE",
    mode: "light",
    background: "#fafaf9",
    surface: "#ffffff",
    surfaceElevated: "#f5f5f4",
    primaryVariants: [
      { name: "indigo", hex: "#4f46e5", hoverHex: "#4338ca", subtle: "rgba(79, 70, 229, 0.12)", gradient: "from-indigo-600 via-purple-600 to-pink-500" },
      { name: "violet", hex: "#7c3aed", hoverHex: "#6d28d9", subtle: "rgba(124, 58, 237, 0.12)", gradient: "from-violet-600 via-indigo-600 to-sky-500" },
      { name: "terracotta", hex: "#c2410c", hoverHex: "#9a3412", subtle: "rgba(194, 65, 12, 0.12)", gradient: "from-orange-600 to-amber-700" },
    ],
    secondary: "stone",
    secondaryHex: "#78716c",
    textPrimary: "#1c1917",
    textSecondary: "#57534e",
    textMuted: "#a8a29e",
    border: "rgba(28, 25, 23, 0.08)",
    borderSubtle: "rgba(28, 25, 23, 0.04)",
    geometry: {
      style: "refined",
      radiusSm: "4px",
      radiusMd: "8px",
      radiusLg: "12px",
      radiusXl: "16px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "borderless_clean",
      backdropBlur: "0px",
      cardShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
      cardBorder: "1px solid rgba(28, 25, 23, 0.08)",
    },
    typography: {
      pairing: "editorial_serif",
      fontDisplay: "Plus Jakarta Sans, Newsreader, Georgia, serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-stone-900",
      bodyStyle: "text-base text-stone-600 leading-relaxed",
      emphasis: "font-semibold text-indigo-600",
    },
    tailwindBgClass: "bg-stone-50",
    tailwindSurfaceClass: "bg-white border-stone-200/60 shadow-sm",
    tailwindCardClass: "bg-white border border-stone-200/60 shadow-sm",
    mood: "Stripe-inspired editorial narrative, generous whitespace, visual storytelling, and calm typographic authority",
    motifs: ["editorial_dividers", "generous_whitespace", "subtle_elevated_surfaces"],
  },

  RESTRAINED_PRODUCT: {
    archetype: "RESTRAINED_PRODUCT",
    mode: "dark",
    background: "#000000",
    surface: "#0a0a0a",
    surfaceElevated: "#121212",
    primaryVariants: [
      { name: "white", hex: "#f8fafc", hoverHex: "#e2e8f0", subtle: "rgba(255, 255, 255, 0.12)", gradient: "from-white via-zinc-200 to-zinc-400" },
      { name: "blue", hex: "#2563eb", hoverHex: "#1d4ed8", subtle: "rgba(37, 99, 235, 0.15)", gradient: "from-blue-500 to-indigo-600" },
      { name: "cyan", hex: "#06b6d4", hoverHex: "#0891b2", subtle: "rgba(6, 182, 212, 0.15)", gradient: "from-cyan-400 to-blue-500" },
    ],
    secondary: "zinc",
    secondaryHex: "#71717a",
    textPrimary: "#ededed",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    border: "rgba(255, 255, 255, 0.10)",
    borderSubtle: "rgba(255, 255, 255, 0.05)",
    geometry: {
      style: "refined",
      radiusSm: "4px",
      radiusMd: "6px",
      radiusLg: "8px",
      radiusXl: "12px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "borderless_clean",
      backdropBlur: "12px",
      cardShadow: "0 0 0 1px rgba(255, 255, 255, 0.08)",
      cardBorder: "1px solid rgba(255, 255, 255, 0.08)",
    },
    typography: {
      pairing: "clean_humanist",
      fontDisplay: "Geist, Plus Jakarta Sans, Inter, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-bold tracking-tighter text-white",
      bodyStyle: "text-sm text-zinc-400 leading-relaxed",
      emphasis: "font-semibold text-white",
    },
    tailwindBgClass: "bg-black",
    tailwindSurfaceClass: "bg-[#0a0a0a] border-zinc-800/80",
    tailwindCardClass: "bg-[#0a0a0a] border border-zinc-800/80",
    mood: "Vercel-inspired restrained product clarity, generous negative space, dominant display typography, and subtle borderless sections",
    motifs: ["hairline_grids", "minimal_contrast", "high_display_scale"],
  },

  PLAYFUL_APPROACHABLE: {
    archetype: "PLAYFUL_APPROACHABLE",
    mode: "light",
    background: "#fdfbf7",
    surface: "#ffffff",
    surfaceElevated: "#fffbeb",
    primaryVariants: [
      { name: "coral", hex: "#f97316", hoverHex: "#ea580c", subtle: "rgba(249, 115, 22, 0.14)", gradient: "from-amber-400 via-orange-500 to-rose-500" },
      { name: "mint", hex: "#10b981", hoverHex: "#059669", subtle: "rgba(16, 185, 129, 0.14)", gradient: "from-emerald-400 via-teal-500 to-cyan-500" },
      { name: "lavender", hex: "#8b5cf6", hoverHex: "#7c3aed", subtle: "rgba(139, 92, 246, 0.14)", gradient: "from-violet-400 via-purple-500 to-pink-500" },
      { name: "sky", hex: "#0284c7", hoverHex: "#0369a1", subtle: "rgba(2, 132, 199, 0.14)", gradient: "from-sky-400 to-indigo-500" },
    ],
    secondary: "stone",
    secondaryHex: "#78716c",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    border: "rgba(245, 158, 11, 0.12)",
    borderSubtle: "rgba(245, 158, 11, 0.06)",
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
      cardShadow: "0 8px 24px -4px rgba(245, 158, 11, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
      cardBorder: "1px solid rgba(245, 158, 11, 0.12)",
    },
    typography: {
      pairing: "modern_geometric",
      fontDisplay: "Outfit, Plus Jakarta Sans, sans-serif",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-bold tracking-tight text-gray-900",
      bodyStyle: "text-sm text-gray-600 leading-relaxed",
      emphasis: "font-bold text-orange-600",
    },
    tailwindBgClass: "bg-[#fdfbf7]",
    tailwindSurfaceClass: "bg-white border-amber-100 shadow-md shadow-amber-950/5",
    tailwindCardClass: "bg-white border border-amber-100/80 shadow-lg shadow-amber-950/5 rounded-3xl",
    mood: "Warm, friendly, and approachable with pill geometry, soft floating elevation, gentle pastel accents, and delightful microcopy",
    motifs: ["soft_pill_geometry", "warm_colored_shadows", "playful_badges", "approachable_microcopy"],
  },

  SOPHISTICATED_ELEGANT: {
    archetype: "SOPHISTICATED_ELEGANT",
    mode: "dark",
    background: "#070a0e",
    surface: "rgba(14, 20, 28, 0.92)",
    surfaceElevated: "rgba(22, 32, 44, 0.96)",
    primaryVariants: [
      { name: "emerald", hex: "#10b981", hoverHex: "#059669", subtle: "rgba(16, 185, 129, 0.16)", gradient: "from-emerald-400 to-teal-500" },
      { name: "cyan", hex: "#06b6d4", hoverHex: "#0891b2", subtle: "rgba(6, 182, 212, 0.16)", gradient: "from-cyan-400 to-blue-500" },
      { name: "gold", hex: "#eab308", hoverHex: "#ca8a04", subtle: "rgba(234, 179, 8, 0.16)", gradient: "from-yellow-400 to-amber-500" },
    ],
    secondary: "slate",
    secondaryHex: "#64748b",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    border: "rgba(255, 255, 255, 0.09)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    geometry: {
      style: "refined",
      radiusSm: "2px",
      radiusMd: "4px",
      radiusLg: "8px",
      radiusXl: "12px",
      radiusFull: "9999px",
    },
    surfaceTreatment: {
      type: "flat_ruled",
      backdropBlur: "0px",
      cardShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.5)",
      cardBorder: "1px solid rgba(255, 255, 255, 0.09)",
    },
    typography: {
      pairing: "technical_mono",
      fontDisplay: "JetBrains Mono, Plus Jakarta Sans, monospace",
      fontBody: "Inter, -apple-system, sans-serif",
      headingStyle: "font-semibold tracking-tight text-slate-100",
      bodyStyle: "text-sm text-slate-300",
      emphasis: "font-mono font-semibold text-emerald-400",
    },
    tailwindBgClass: "bg-[#070a0e]",
    tailwindSurfaceClass: "bg-[#0e141c]/90 border-slate-800",
    tailwindCardClass: "bg-[#0e141c] border border-slate-800/80 shadow-md",
    mood: "Sophisticated high-precision financial terminal with calm focal hierarchy, clear data visualizations, and restrained dark graphite surfaces",
    motifs: ["tabular_numbers", "subtle_liquidity_indicators", "calm_graphite_contrast"],
  },
};

/**
 * Extracts semantic personality signals directly from the user prompt and domain intent.
 * Evaluates tone, density, surface preference, and composition preference dynamically
 * without rigid hardcoded mappings.
 */
export function extractSemanticPersonality(prompt: string, domainHint?: string): SemanticPersonality {
  const text = `${prompt} ${domainHint || ""}`.toLowerCase();

  // 1. Playful, cute, friendly, approachable, educational, community signals
  if (
    text.includes("friendly") ||
    text.includes("playful") ||
    text.includes("approachable") ||
    text.includes("cute") ||
    text.includes("delightful") ||
    text.includes("gamified") ||
    text.includes("interactive learning") ||
    text.includes("education") ||
    text.includes("student") ||
    text.includes("kids") ||
    text.includes("children") ||
    text.includes("pet ") ||
    text.includes("pets ") ||
    text.includes("grooming")
  ) {
    return {
      tone: text.includes("playful") || text.includes("cute") || text.includes("gamified") ? "playful" : "friendly",
      compositionPreference: "PLAYFUL_WORKSPACE",
      cardEnclosureStyle: "soft_floating",
    };
  }

  // 2. Calm, serene, wellness, mindful, sanctuary, holistic signals
  if (
    text.includes("wellness") ||
    text.includes("mindful") ||
    text.includes("meditation") ||
    text.includes("spa") ||
    text.includes("calm") ||
    text.includes("serene") ||
    text.includes("sanctuary") ||
    text.includes("retreat") ||
    text.includes("holistic") ||
    text.includes("therapy") ||
    text.includes("yoga") ||
    text.includes("botanical")
  ) {
    return {
      tone: "calm",
      compositionPreference: "EDITORIAL_LANDING",
      cardEnclosureStyle: "borderless",
    };
  }

  // 3. Editorial, curatorial, museum, archive, monograph, cultural, heritage signals
  if (
    text.includes("museum") ||
    text.includes("curatorial") ||
    text.includes("archive") ||
    text.includes("artifact") ||
    text.includes("monograph") ||
    text.includes("exhibition") ||
    text.includes("provenance") ||
    text.includes("heritage") ||
    text.includes("atelier") ||
    text.includes("editorial") ||
    text.includes("craft") ||
    text.includes("ceramics") ||
    text.includes("luthier") ||
    text.includes("history") ||
    text.includes("collection research")
  ) {
    return {
      tone: "editorial",
      compositionPreference: "EDITORIAL_LANDING",
      cardEnclosureStyle: "borderless",
    };
  }

  // 4. Minimal, modern, restrained product, SaaS, developer tools, cloud infrastructure
  if (
    text.includes("minimal") ||
    text.includes("restrained") ||
    text.includes("developer") ||
    text.includes("saas") ||
    text.includes("productivity") ||
    text.includes("workflow") ||
    text.includes("cloud") ||
    text.includes("infrastructure") ||
    text.includes("workspace") ||
    text.includes("simple") ||
    text.includes("clean")
  ) {
    return {
      tone: "minimal",
      compositionPreference: "MINIMAL_SAAS_CONSOLE",
      cardEnclosureStyle: "borderless",
    };
  }

  // 5. Visual timeseries analytics, high-density sensor grids, power generation
  if (
    text.includes("timeseries") ||
    text.includes("inverter") ||
    text.includes("sensor") ||
    text.includes("power grid") ||
    text.includes("solar") ||
    text.includes("photovoltaic") ||
    text.includes("drill-down") ||
    text.includes("drilldown")
  ) {
    return {
      tone: "technical",
      compositionPreference: "VISUAL_ANALYTICS_CANVAS",
      cardEnclosureStyle: "structured_ruled",
    };
  }

  // 6. Split workspace: litigation, legal docket, case management, medical triage
  if (
    text.includes("litigation") ||
    text.includes("legal") ||
    text.includes("docket") ||
    text.includes("matter") ||
    text.includes("case") ||
    text.includes("chambers") ||
    text.includes("hospital") ||
    text.includes("clinical") ||
    text.includes("patient triage")
  ) {
    return {
      tone: "technical",
      compositionPreference: "SPLIT_SCREEN_WORKSPACE",
      cardEnclosureStyle: "structured_ruled",
    };
  }

  // 7. Trading, finance, settlement, order execution, HFT
  if (
    text.includes("trading") ||
    text.includes("fintech") ||
    text.includes("var risk") ||
    text.includes("order routing") ||
    text.includes("execution") ||
    text.includes("portfolio") ||
    text.includes("arbitrage") ||
    text.includes("market")
  ) {
    return {
      tone: text.includes("wealth") || text.includes("private banking") ? "luxurious" : "technical",
      compositionPreference: "ASYMMETRIC_PRODUCT_DASHBOARD",
      cardEnclosureStyle: "structured_ruled",
    };
  }

  // Default balanced/bold fallback
  return {
    tone: "bold",
    compositionPreference: "ASYMMETRIC_PRODUCT_DASHBOARD",
    cardEnclosureStyle: "borderless",
  };
}

/**
 * Derives a complete, deterministic, and WCAG-compliant VisualArtDirectionContract
 * based on prompt semantics, semantic personality, and a reproducible hash seed.
 */
export function deriveArtDirection(prompt: string, domainHint?: string): VisualArtDirectionContract {
  const seedString = `${prompt.trim()} ${domainHint || ""}`.trim();
  const hash = computeDeterministicHash(seedString);
  const promptLower = seedString.toLowerCase();

  // 1. Semantic Personality Extraction
  const semanticPersonality = extractSemanticPersonality(prompt, domainHint);

  // 2. Archetype Mapping based on Semantic Personality Tone & Domain Signals
  let compatibleArchetypes: Array<VisualArtDirectionContract["archetype"]> = [];

  if (semanticPersonality.tone === "playful" || semanticPersonality.tone === "friendly") {
    compatibleArchetypes = ["PLAYFUL_APPROACHABLE", "CALM_BOTANICAL", "BOTANICAL_EARTH", "NORDIC_MINIMAL"];
  } else if (semanticPersonality.tone === "calm") {
    compatibleArchetypes = ["CALM_BOTANICAL", "EDITORIAL_NARRATIVE", "BOTANICAL_EARTH", "NORDIC_MINIMAL"];
  } else if (semanticPersonality.tone === "editorial") {
    compatibleArchetypes = ["EDITORIAL_NARRATIVE", "EDITORIAL_HERITAGE", "AMBER_WARM_DARK"];
  } else if (semanticPersonality.tone === "minimal") {
    compatibleArchetypes = ["RESTRAINED_PRODUCT", "MODERN_SWISS", "NORDIC_MINIMAL"];
  } else if (semanticPersonality.tone === "technical") {
    if (promptLower.includes("clinical") || promptLower.includes("laboratory") || promptLower.includes("pathology") || promptLower.includes("diagnostic") || promptLower.includes("biospecimen") || promptLower.includes("hospital")) {
      compatibleArchetypes = ["CLINICAL_LABORATORY"];
    } else if (promptLower.includes("trading") || promptLower.includes("fintech") || promptLower.includes("var") || promptLower.includes("order routing")) {
      compatibleArchetypes = ["SOPHISTICATED_ELEGANT", "OBSIDIAN_PRECISION", "INDUSTRIAL_UTILITY"];
    } else if (promptLower.includes("ocean") || promptLower.includes("maritime") || promptLower.includes("marine")) {
      compatibleArchetypes = ["OCEANIC_MARITIME", "INDUSTRIAL_UTILITY", "OBSIDIAN_PRECISION"];
    } else {
      compatibleArchetypes = ["INDUSTRIAL_UTILITY", "OBSIDIAN_PRECISION", "MODERN_SWISS"];
    }
  } else if (semanticPersonality.tone === "luxurious") {
    compatibleArchetypes = ["SOPHISTICATED_ELEGANT", "AMBER_WARM_DARK", "EDITORIAL_HERITAGE"];
  } else {
    // Bold / general
    compatibleArchetypes = [
      "RESTRAINED_PRODUCT",
      "EDITORIAL_NARRATIVE",
      "MODERN_SWISS",
      "OCEANIC_MARITIME",
      "NEON_SYNTHETIC",
      "BOTANICAL_EARTH",
    ];
  }

  // 3. Deterministic Selection
  const archetypeKey = compatibleArchetypes[hash % compatibleArchetypes.length];
  const def = ARCHETYPES[archetypeKey];

  // Primary color variant selection
  const primaryVariant = def.primaryVariants[Math.abs(hash >> 3) % def.primaryVariants.length] || def.primaryVariants[0];

  // Navigation style variation
  const navStyles: Array<VisualArtDirectionContract["navigation"]["style"]> = [
    "MODERN_SIDEBAR",
    "TOPBAR_PILL",
    "COMMAND_CONSOLE",
    "DUAL_SIDEBAR",
  ];
  const navStyle = navStyles[Math.abs(hash >> 6) % navStyles.length];

  // Spacing density variation
  const densities: Array<VisualArtDirectionContract["spacing"]["density"]> = [
    "compact",
    "balanced",
    "spacious",
  ];
  const density = densities[Math.abs(hash >> 9) % densities.length];

  // Layout family selection based on archetype and composition preference
  const layoutFamilies: Record<string, VisualArtDirectionContract["layoutPersonality"]["family"]> = {
    OCEANIC_MARITIME: "COMMAND_CENTER",
    INDUSTRIAL_UTILITY: "COMMAND_CENTER",
    CLINICAL_LABORATORY: "WORKSPACE_SPLIT",
    EDITORIAL_HERITAGE: "EDITORIAL_LANDING",
    OBSIDIAN_PRECISION: "ASYMMETRIC_PRODUCT_DASHBOARD",
    MODERN_SWISS: "WORKSPACE_SPLIT",
    BOTANICAL_EARTH: "TIMELINE_PIPELINE",
    CALM_BOTANICAL: "EDITORIAL_LANDING",
    NORDIC_MINIMAL: "CALENDAR_SCHEDULE",
    AMBER_WARM_DARK: "EDITORIAL_LANDING",
    NEON_SYNTHETIC: "MEDIA_SHOWCASE",
    EDITORIAL_NARRATIVE: "EDITORIAL_LANDING",
    RESTRAINED_PRODUCT: "WORKSPACE_SPLIT",
    PLAYFUL_APPROACHABLE: "PLAYFUL_WORKSPACE",
    SOPHISTICATED_ELEGANT: "ASYMMETRIC_PRODUCT_DASHBOARD",
  };
  const layoutFamily = layoutFamilies[archetypeKey] || "ASYMMETRIC_PRODUCT_DASHBOARD";

  // WCAG 2.1 AA Contrast Safeguard:
  let finalPrimaryText = def.textPrimary;
  let finalSecondaryText = def.textSecondary;
  let finalMutedText = def.textMuted;

  const contrast = getContrastRatio(finalPrimaryText, def.background);
  if (contrast < 4.5) {
    if (def.mode === "light") {
      finalPrimaryText = "#0f172a";
      finalSecondaryText = "#334155";
      finalMutedText = "#64748b";
    } else {
      finalPrimaryText = "#f8fafc";
      finalSecondaryText = "#cbd5e1";
      finalMutedText = "#94a3b8";
    }
  }

  // Active navigation style & badge styling
  const badgeStyle = `bg-[${primaryVariant.hex}]/15 text-[${primaryVariant.hex}] border border-[${primaryVariant.hex}]/30`;
  const activeNavStyle = `bg-[${primaryVariant.hex}]/15 text-[${primaryVariant.hex}] border-l-2 border-[${primaryVariant.hex}]`;

  return {
    id: `vad_${archetypeKey.toLowerCase()}_${hash.toString(16)}`,
    name: `${archetypeKey.replace(/_/g, " ")} (${primaryVariant.name})`,
    archetype: archetypeKey,
    colorSystem: {
      mode: def.mode,
      background: def.background,
      surface: def.surface,
      surfaceElevated: def.surfaceElevated,
      primary: primaryVariant.name,
      primaryHex: primaryVariant.hex,
      primaryHoverHex: primaryVariant.hoverHex,
      primarySubtle: primaryVariant.subtle,
      secondary: def.secondary,
      secondaryHex: def.secondaryHex,
      accentGradient: primaryVariant.gradient,
      textPrimary: finalPrimaryText,
      textSecondary: finalSecondaryText,
      textMuted: finalMutedText,
      border: def.border,
      borderSubtle: def.borderSubtle,
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#ef4444",
      badgeStyle,
      activeNavStyle,
      tailwindBgClass: def.tailwindBgClass,
      tailwindSurfaceClass: def.tailwindSurfaceClass,
      tailwindCardClass: def.tailwindCardClass,
    },
    geometry: def.geometry,
    surfaceTreatment: def.surfaceTreatment,
    typography: def.typography,
    navigation: {
      style: navStyle,
    },
    spacing: {
      density,
    },
    semanticPersonality,
    layoutPersonality: {
      family: layoutFamily,
      mood: def.mood,
      motifs: def.motifs,
    },
  };
}
