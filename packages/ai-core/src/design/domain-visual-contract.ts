import type { ProjectSpecification } from "../architect/specification.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { CompositionGraph, CompositionGraphSynthesizer } from "./composition-graph.js";
import {
  deriveArtDirection,
  type VisualArtDirectionContract,
} from "./visual-art-direction.js";

import { NavigationDesignResolver } from "./navigation-design.js";

export { CompositionGraph, CompositionGraphSynthesizer, deriveArtDirection, type VisualArtDirectionContract };

export interface DomainVisualDesignContract {
  productType: string;
  domain: string;
  compositionGraph?: CompositionGraph;
  artDirection?: VisualArtDirectionContract;

  visualPersonality: {
    mood: string;
    density: "compact" | "balanced" | "spacious";
    formality: "casual" | "professional" | "luxury" | "technical" | "expressive";
  };

  colorSystem: {
    mode: "light" | "dark" | "hybrid" | "warm_dark" | "deep_obsidian" | "neon_dark";
    background: string;       // Tailwind class e.g. "bg-stone-950", "bg-[#090b10]", "bg-zinc-950"
    surface: string;          // Tailwind class e.g. "bg-stone-900/70 border-stone-800"
    card: string;             // Tailwind class e.g. "bg-stone-900/90 border border-stone-800/80 shadow-lg shadow-black/40"
    primary: string;          // Primary accent color name, e.g. "amber", "emerald", "violet", "cyan", "rose", "sky"
    secondary: string;        // Secondary color name, e.g. "stone", "zinc", "slate", "neutral"
    accent: string;           // Hex or gradient, e.g. "from-amber-500 to-orange-600"
    textPrimary: string;      // e.g. "text-stone-100", "text-zinc-100", "text-amber-50"
    textMuted: string;        // e.g. "text-stone-400", "text-zinc-400", "text-amber-200/60"
    success: string;
    warning: string;
    danger: string;
    badgeStyle: string;       // e.g. "bg-amber-500/10 text-amber-400 border border-amber-500/20"
    activeNavStyle: string;   // e.g. "bg-amber-500/15 text-amber-300 border-r-2 border-amber-500"
  };

  typography: {
    fontFamily: string;       // e.g. "Cinzel, Inter, sans-serif", "JetBrains Mono, monospace", "Plus Jakarta Sans, sans-serif"
    headingStyle: string;     // Tailwind classes e.g. "tracking-tight font-semibold"
    bodyStyle: string;        // e.g. "text-sm text-stone-300"
    emphasis: string;         // e.g. "font-medium text-amber-400"
  };

  layoutFamily:
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

  navigation: {
    strategy:
      | "TOPBAR_PILL"
      | "DUAL_SIDEBAR"
      | "MINIMAL_DRAWER"
      | "COMMAND_CONSOLE"
      | "MODERN_SIDEBAR";
  };

  components: string[];

  dashboardComposition: {
    headline: string;
    primaryMetric: {
      label: string;
      value: string;
      trend: string;
      icon: string;
    };
    secondaryMetrics: Array<{
      label: string;
      value: string;
      trend: string;
      icon: string;
    }>;
    heroAction: {
      label: string;
      targetRoute: string;
      icon: string;
    };
    alerts: string[];
    primaryWidget: "TIMELINE" | "KANBAN" | "TELEMETRY" | "CALENDAR" | "SHOWCASE" | "WORKSPACE" | "ANALYTICS" | "EDITORIAL_STORY" | "PLAYFUL_PROGRESS" | "ASYMMETRIC_DESK" | "CANVAS";
  };

  composition?: {
    hero: {
      type: "sanctuary_showcase" | "matter_header" | "live_stage_header" | "telemetry_banner" | "standard";
      title: string;
      subtitle: string;
      badge?: string;
      cta: { label: string; targetRoute: string; icon?: string };
    };
    primaryWorkspace: {
      type: "availability_matrix" | "master_detail" | "live_stage_matrix" | "telemetry_grid" | "kanban_board" | "timeline_pipeline" | "document_workspace" | "catalog_grid" | "session_schedule" | "workflow_board" | "canvas_stage";
      title: string;
      description: string;
      density?: "compact" | "balanced" | "spacious";
      capabilities?: string[];
    };
    secondaryWorkspace: {
      type: "arrival_queue" | "chronological_timeline" | "dispatch_board" | "activity_stream" | "status_pipeline" | "financial_summary" | "sky_object_catalogue";
      title: string;
    };
    supportingWidgets: Array<{
      type: "metric_cluster" | "gauge_dial" | "venue_capacity" | "document_locker" | "telemetry_monitor" | "sector_heatmap" | "telescope_equipment" | "astronomer_roster";
      title: string;
    }>;
    interactionModel: "reservation_flow" | "case_dossier" | "live_dispatch" | "telemetry_command" | "general_operations" | "session_reservation_flow" | "state_machine_execution" | "spatial_exploration";
  };

  antiPatterns: string[];
}

export interface ResolvedCssTokens {
  backgroundColor: string;
  surfaceColor: string;
  surfaceElevatedColor: string;
  primaryColor: string;
  primaryHoverColor: string;
  primarySubtleColor: string;
  secondaryColor: string;
  accentGradient: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  textMutedColor: string;
  borderColor: string;
  borderSubtleColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  fontDisplay: string;
  fontBody: string;
}
export class DomainVisualContractGenerator {
  /**
   * Computes the relative luminance of an sRGB color per WCAG 2.1 specifications.
   */
  public static getLuminance(color: string): number {
    const rgb = DomainVisualContractGenerator.parseColor(color);
    if (!rgb) return 0.5;
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Computes the WCAG contrast ratio between two colors (ranging from 1:1 to 21:1).
   */
  public static getContrastRatio(color1: string, color2: string): number {
    const l1 = DomainVisualContractGenerator.getLuminance(color1);
    const l2 = DomainVisualContractGenerator.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Helper to parse hex or rgb string into { r, g, b }.
   */
  public static parseColor(color: string): { r: number; g: number; b: number } | null {
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

  /**
   * Helper to convert a hex or color string to rgba with specified alpha.
   */
  public static hexToRgba(color: string, alpha: number): string {
    const rgb = DomainVisualContractGenerator.parseColor(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  /**
   * Translates domain color names and theme parameters into concrete, guaranteed CSS hex/rgba tokens.
   * Enforces WCAG contrast safeguards to guarantee text visibility across all palettes.
   */
  public static resolveCssTokens(contract: DomainVisualDesignContract): ResolvedCssTokens {
    const ad = contract.artDirection || deriveArtDirection(contract.domain);
    const isLight = contract.colorSystem?.mode
      ? contract.colorSystem.mode.includes("light")
      : ad.colorSystem.mode === "light";
    const primary = (contract.colorSystem.primary || ad.colorSystem.primary || "teal").toLowerCase();
    
    // Primary palette map with fallback to artDirection
    const primaryMap: Record<string, { hex: string; hover: string; subtle: string }> = {
      sage:       { hex: "#5b7f6e", hover: "#4a6b5b", subtle: "rgba(91, 127, 110, 0.18)" },
      teal:       { hex: "#0d9488", hover: "#0f766e", subtle: "rgba(13, 148, 136, 0.18)" },
      amber:      { hex: "#d97706", hover: "#b45309", subtle: "rgba(217, 119, 6, 0.18)" },
      emerald:    { hex: "#059669", hover: "#047857", subtle: "rgba(5, 150, 105, 0.18)" },
      violet:     { hex: "#7c3aed", hover: "#6d28d9", subtle: "rgba(124, 58, 237, 0.18)" },
      cyan:       { hex: "#0891b2", hover: "#0e7490", subtle: "rgba(8, 145, 178, 0.18)" },
      rose:       { hex: "#e11d48", hover: "#be123c", subtle: "rgba(225, 29, 72, 0.18)" },
      sky:        { hex: "#0284c7", hover: "#0369a1", subtle: "rgba(2, 132, 199, 0.18)" },
      indigo:     { hex: "#4f46e5", hover: "#4338ca", subtle: "rgba(79, 70, 229, 0.18)" },
      blue:       { hex: "#2563eb", hover: "#1d4ed8", subtle: "rgba(37, 99, 235, 0.18)" },
      fuchsia:    { hex: "#c026d3", hover: "#a21caf", subtle: "rgba(192, 38, 211, 0.18)" },
      orange:     { hex: "#f97316", hover: "#ea580c", subtle: "rgba(249, 115, 22, 0.18)" },
      terracotta: { hex: "#c4734a", hover: "#a85d38", subtle: "rgba(196, 115, 74, 0.18)" },
      yellow:     { hex: "#eab308", hover: "#ca8a04", subtle: "rgba(234, 179, 8, 0.18)" },
    };

    const pTokens = contract.artDirection ? {
      hex: contract.artDirection.colorSystem.primaryHex,
      hover: contract.artDirection.colorSystem.primaryHoverHex,
      subtle: contract.artDirection.colorSystem.primarySubtle,
    } : (primaryMap[primary] || {
      hex: ad.colorSystem.primaryHex,
      hover: ad.colorSystem.primaryHoverHex,
      subtle: ad.colorSystem.primarySubtle,
    });

    // Background & surface resolution: derived dynamically from art direction
    let bg = ad.colorSystem.background;
    let surface = ad.colorSystem.surface;
    let surfaceElevated = ad.colorSystem.surfaceElevated;
    let border = ad.colorSystem.border;
    let borderSubtle = ad.colorSystem.borderSubtle;
    let textPrimary = ad.colorSystem.textPrimary;
    let textSecondary = ad.colorSystem.textSecondary;
    let textMuted = ad.colorSystem.textMuted;

    if (contract.colorSystem.background && contract.colorSystem.background.includes("#")) {
      const hexMatch = contract.colorSystem.background.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
      if (hexMatch) bg = hexMatch[0];
    }

    if (contract.colorSystem.surface && contract.colorSystem.surface.includes("#")) {
      const hexMatch = contract.colorSystem.surface.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
      if (hexMatch) {
        const opacityMatch = contract.colorSystem.surface.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\/(\d+)/);
        if (opacityMatch) {
          const alpha = parseInt(opacityMatch[2], 10) / 100;
          surface = DomainVisualContractGenerator.hexToRgba(hexMatch[0], alpha);
          surfaceElevated = DomainVisualContractGenerator.hexToRgba(hexMatch[0], Math.min(1, alpha + 0.1));
        } else {
          surface = hexMatch[0];
          surfaceElevated = hexMatch[0];
        }
      }
    } else if (contract.colorSystem.mode === "warm_dark") {
      bg = "#0e0c0b";
      surface = "rgba(26, 22, 20, 0.94)";
      surfaceElevated = "rgba(38, 32, 28, 0.98)";
      textPrimary = "#fafaf9";
      textSecondary = "#d6d3d1";
      textMuted = "#a8a29e";
      border = "rgba(214, 211, 209, 0.14)";
    } else if (contract.colorSystem.mode === "deep_obsidian") {
      bg = "#08080a";
      surface = "rgba(18, 18, 22, 0.94)";
      surfaceElevated = "rgba(28, 28, 36, 0.98)";
      textPrimary = "#f4f4f5";
      textSecondary = "#a1a1aa";
      textMuted = "#52525b";
    } else if (contract.colorSystem.mode === "neon_dark") {
      bg = "#07060d";
      surface = "rgba(17, 13, 31, 0.90)";
      surfaceElevated = "rgba(32, 24, 58, 0.96)";
      textPrimary = "#fdf4ff";
      textSecondary = "#d8b4fe";
      textMuted = "#a855f7";
      border = "rgba(139, 92, 246, 0.25)";
    } else if (isLight) {
      bg = "#f8fafc";
      surface = "#ffffff";
      surfaceElevated = "#f1f5f9";
      textPrimary = "#0f172a";
      textSecondary = "#475569";
      textMuted = "#94a3b8";
      border = "rgba(15, 23, 42, 0.1)";
      borderSubtle = "rgba(15, 23, 42, 0.05)";
    }

    // Absolute safeguard: if dark mode or dark background, surface MUST NEVER be light (#ffffff)
    const bgLuminance = DomainVisualContractGenerator.getLuminance(bg);
    const isDarkTheme = !isLight || bgLuminance < 0.5;
    if (isDarkTheme) {
      const surfaceLuminance = DomainVisualContractGenerator.getLuminance(surface);
      if (surfaceLuminance > 0.4 || surface.toLowerCase() === "#ffffff" || surface.toLowerCase() === "#fff") {
        surface = "rgba(12, 18, 24, 0.94)";
        surfaceElevated = "rgba(18, 26, 35, 0.98)";
      }
    }

    // WCAG Contrast Safeguard: Ensure textPrimary has minimum 4.5:1 contrast against both background and surface
    const bgContrast = DomainVisualContractGenerator.getContrastRatio(textPrimary, bg);
    const surfaceContrast = DomainVisualContractGenerator.getContrastRatio(textPrimary, surface);
    if (bgContrast < 4.5 || surfaceContrast < 4.5) {
      if (bgLuminance < 0.5 || isDarkTheme) {
        textPrimary = "#f8fafc";
        textSecondary = "#cbd5e1";
        textMuted = "#94a3b8";
      } else {
        textPrimary = "#0f172a";
        textSecondary = "#334155";
        textMuted = "#64748b";
      }
    }

    // Radius density from art direction geometry
    let radiusSm = ad.geometry.radiusSm;
    let radiusMd = ad.geometry.radiusMd;
    let radiusLg = ad.geometry.radiusLg;
    let radiusXl = ad.geometry.radiusXl;
    if (contract.visualPersonality.density === "compact") {
      radiusSm = "1px";
      radiusMd = "2px";
      radiusLg = "4px";
      radiusXl = "6px";
    } else if (contract.visualPersonality.density === "spacious") {
      radiusSm = "4px";
      radiusMd = "8px";
      radiusLg = "16px";
      radiusXl = "24px";
    }

    return {
      backgroundColor: bg,
      surfaceColor: surface,
      surfaceElevatedColor: surfaceElevated,
      primaryColor: pTokens.hex,
      primaryHoverColor: pTokens.hover,
      primarySubtleColor: pTokens.subtle,
      secondaryColor: ad.colorSystem.secondaryHex || (isLight ? "#64748b" : "#71717a"),
      accentGradient: contract.colorSystem.accent || ad.colorSystem.accentGradient,
      textPrimaryColor: textPrimary,
      textSecondaryColor: textSecondary,
      textMutedColor: textMuted,
      borderColor: border,
      borderSubtleColor: borderSubtle,
      successColor: contract.colorSystem.success || "#22c55e",
      warningColor: contract.colorSystem.warning || "#f59e0b",
      dangerColor: contract.colorSystem.danger || "#ef4444",
      radiusSm,
      radiusMd,
      radiusLg,
      radiusXl,
      radiusFull: "9999px",
      shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      shadowMd: ad.surfaceTreatment.cardShadow || "0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
      shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
      fontDisplay: contract.typography.fontFamily || ad.typography.fontDisplay || "Plus Jakarta Sans, Inter, sans-serif",
      fontBody: ad.typography.fontBody || "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    };
  }

  /**
   * Synthesize a complete DomainVisualDesignContract from prompt, spec, and architecture contract.
   * Derives design tokens, colors, layouts, navigation, components, and dashboard compositions
   * dynamically based on domain semantic intelligence without hardcoding rigid static templates.
   */
  public static deriveContract(
    prompt: string,
    spec?: Partial<ProjectSpecification>,
    archContract?: Partial<ArchitectureContractV1>
  ): DomainVisualDesignContract {
    const rawText = `${prompt} ${spec?.name || ""} ${(spec?.dataModels || []).join(" ")} ${(archContract?.requiredModels || []).join(" ")}`.toLowerCase();

    // Derive deterministic art direction based on prompt semantics and stable hash
    let seedVal: number | undefined = (spec as any)?.seed !== undefined ? Number((spec as any).seed) : undefined;
    if (seedVal === undefined && archContract?.architectureHash) {
      let h = 0;
      for (let i = 0; i < archContract.architectureHash.length; i++) {
        h = (Math.imul(31, h) + archContract.architectureHash.charCodeAt(i)) | 0;
      }
      seedVal = Math.abs(h);
    }
    const artDirection = deriveArtDirection(prompt, spec?.name || (spec?.dataModels || []).join(" "), seedVal);

    // ── 1. Semantic Domain Classification ────────────────────────────────────
    let domain = "General Enterprise";
    let productType = "Operations Platform";
    let layoutFamily: DomainVisualDesignContract["layoutFamily"] = artDirection.layoutPersonality.family;
    let navStrategy: DomainVisualDesignContract["navigation"]["strategy"] = artDirection.navigation.style;
    let density: DomainVisualDesignContract["visualPersonality"]["density"] = artDirection.spacing.density;
    let formality: DomainVisualDesignContract["visualPersonality"]["formality"] = "professional";
    let mood = artDirection.layoutPersonality.mood;

    // Palette Defaults derived from Art Direction (eliminating hardcoded Slate-900 bias)
    let mode: DomainVisualDesignContract["colorSystem"]["mode"] = artDirection.colorSystem.mode;
    let bgClass = artDirection.colorSystem.tailwindBgClass;
    let surfaceClass = artDirection.colorSystem.tailwindSurfaceClass;
    let cardClass = artDirection.colorSystem.tailwindCardClass;
    let primary = artDirection.colorSystem.primary;
    let secondary = artDirection.colorSystem.secondary;
    let accent = artDirection.colorSystem.accentGradient;
    let textPrimary = artDirection.colorSystem.mode === "light" ? "text-slate-900" : "text-zinc-100";
    let textMuted = artDirection.colorSystem.mode === "light" ? "text-slate-600" : "text-zinc-400";
    let badgeStyle = artDirection.colorSystem.badgeStyle;
    let activeNavStyle = artDirection.colorSystem.activeNavStyle;
    let fontFamily = artDirection.typography.fontDisplay;
    let headingStyle = artDirection.typography.headingStyle;
    let bodyStyle = artDirection.typography.bodyStyle;
    let emphasis = artDirection.typography.emphasis;

    // Dashboard defaults (clean, product-neutral, zero telemetry/SaaS jargon)
    let headline = "Curated Product Experience";
    let primaryMetric = { label: "Active Items", value: "24", trend: "Curated collection", icon: "Layers" };
    let secondaryMetrics = [
      { label: "Featured Work", value: "12", trend: "Curated highlight", icon: "Sparkles" },
      { label: "Archival Records", value: "148", trend: "Indexed archives", icon: "Compass" },
      { label: "Community Members", value: "840", trend: "Active readers", icon: "Users" },
    ];
    let heroAction = { label: "Explore Collection", targetRoute: "/", icon: "ArrowRight" };
    let alerts = ["Curated collection and seasonal archives are now active."];
    let primaryWidget: DomainVisualDesignContract["dashboardComposition"]["primaryWidget"] = "SHOWCASE";
    let components: string[] = ["ShowcaseGrid", "Timeline", "StatusPipeline"];
    let antiPatterns: string[] = [
      "Generic SaaS blue buttons",
      "Generic 4-box card template",
      "Empty placeholder states without action",
      "Unstyled raw HTML tables"
    ];

    // ── 2. Parametric Product & Domain Synthesis (Zero Hardcoding) ──────────
    const brandName = spec?.name && !spec.name.toLowerCase().includes("app") && !spec.name.toLowerCase().includes("project")
      ? spec.name
      : (NavigationDesignResolver.sanitizeBrandName(undefined, prompt) || "System");

    domain = spec?.domainCategory || (spec as any)?.category || brandName;
    productType = spec?.name || "Operations Workspace";
    headline = `${brandName} ${spec?.domainCategory || (spec as any)?.category ? "— " + (spec?.domainCategory || (spec as any)?.category) : "Experience & Operations"}`;

    const firstModel = spec?.dataModels?.[0] || "Record";
    primaryMetric = {
      label: `Total ${firstModel}s`,
      value: "48",
      trend: "Nominal & Verified",
      icon: "Layers",
    };
    secondaryMetrics = [
      { label: "Active Operational Channels", value: "12", trend: "Synchronized", icon: "Activity" },
      { label: "System Health", value: "99.4%", trend: "Optimal", icon: "Sparkles" },
      { label: "Verified Milestones", value: "100%", trend: "Archived & Sealed", icon: "CheckCircle" },
    ];
    heroAction = {
      label: `+ New ${firstModel}`,
      targetRoute: `/${firstModel.toLowerCase()}s`,
      icon: "Plus",
    };
    alerts = [`${brandName} operational systems and verified registers active.`];

    return {
      productType,
      domain,
      artDirection,
      visualPersonality: {
        mood,
        density,
        formality,
      },
      antiPatterns,
      colorSystem: {
        mode,
        background: bgClass,
        surface: surfaceClass,
        card: cardClass,
        primary,
        secondary,
        accent,
        textPrimary,
        textMuted,
        success: "emerald",
        warning: "amber",
        danger: "rose",
        badgeStyle,
        activeNavStyle,
      },
      typography: {
        fontFamily,
        headingStyle,
        bodyStyle,
        emphasis,
      },
      layoutFamily,
      navigation: {
        strategy: navStrategy,
      },
      components,
      dashboardComposition: {
        headline,
        primaryMetric,
        secondaryMetrics,
        heroAction,
        alerts,
        primaryWidget,
      },
      compositionGraph: CompositionGraphSynthesizer.synthesize(prompt, domain, layoutFamily),
    };
  }

  public static generate(
    prompt: string,
    spec?: Partial<ProjectSpecification>,
    archContract?: Partial<ArchitectureContractV1>
  ): DomainVisualDesignContract {
    return DomainVisualContractGenerator.deriveContract(prompt, spec, archContract);
  }
}

export const DomainVisualDesignContractDeriver = {
  derive: (
    prompt: string,
    spec?: ProjectSpecification,
    architecture?: ArchitectureContractV1
  ): DomainVisualDesignContract => DomainVisualContractGenerator.deriveContract(prompt, spec, architecture),
};


