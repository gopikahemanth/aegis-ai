import type { ProjectSpecification } from "../architect/specification.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { CompositionGraph, CompositionGraphSynthesizer } from "./composition-graph.js";
import {
  deriveArtDirection,
  type VisualArtDirectionContract,
} from "./visual-art-direction.js";

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
    primaryWidget: "TIMELINE" | "KANBAN" | "TELEMETRY" | "CALENDAR" | "SHOWCASE" | "WORKSPACE" | "ANALYTICS" | "EDITORIAL_STORY" | "PLAYFUL_PROGRESS" | "ASYMMETRIC_DESK";
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
      type: "availability_matrix" | "master_detail" | "live_stage_matrix" | "telemetry_grid" | "kanban_board" | "timeline_pipeline" | "document_workspace" | "catalog_grid" | "session_schedule" | "workflow_board";
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
    interactionModel: "reservation_flow" | "case_dossier" | "live_dispatch" | "telemetry_command" | "general_operations" | "session_reservation_flow" | "state_machine_execution";
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
      terracotta: { hex: "#c2410c", hover: "#9a3412", subtle: "rgba(194, 65, 12, 0.18)" },
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
    const artDirection = deriveArtDirection(prompt, spec?.name || (spec?.dataModels || []).join(" "));

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

    // Dashboard defaults
    let headline = "Executive Operational Overview";
    let primaryMetric = { label: "Active Throughput", value: "98.4%", trend: "+2.6% this cycle", icon: "Activity" };
    let secondaryMetrics = [
      { label: "Total Managed Entities", value: "1,248", trend: "+12 new today", icon: "Layers" },
      { label: "Pending Actions", value: "14", trend: "Normal velocity", icon: "Clock" },
      { label: "System Health Score", value: "99.9%", trend: "Optimal uptime", icon: "ShieldCheck" },
    ];
    let heroAction = { label: "+ Create New Record", targetRoute: "/inventory", icon: "PlusCircle" };
    let alerts = ["All operational pipelines reporting normal baseline telemetry."];
    let primaryWidget: DomainVisualDesignContract["dashboardComposition"]["primaryWidget"] = "TELEMETRY";
    let components: string[] = ["TelemetryGrid", "StatusPipeline", "ActivityStream"];
    let antiPatterns: string[] = [
      "Generic SaaS blue buttons",
      "Generic 4-box card template",
      "Empty placeholder states without action",
      "Unstyled raw HTML tables"
    ];

    // ── 2. Domain-Specific Visual Adaptation ──────────────────────────────────

    // A. Music Festival / Live Production / Entertainment / Tour
    if (rawText.includes("music") || rawText.includes("festival") || rawText.includes("concert") || rawText.includes("soundwave") || rawText.includes("live-event") || rawText.includes("performer") || (rawText.includes("artist") && rawText.includes("stage"))) {
      domain = "Music & Live Entertainment";
      productType = "Festival Operations & Stage Dispatch";
      layoutFamily = "MEDIA_SHOWCASE";
      navStrategy = "COMMAND_CONSOLE";
      density = "balanced";
      formality = "expressive";
      mood = "Electric, immersive, energetic, and high-impact with obsidian, cyan neon, and ultraviolet glows";

      mode = "neon_dark";
      bgClass = "bg-[#07060D]";
      surfaceClass = "bg-[#110D1F]/80 border-[#281E45]";
      cardClass = "bg-[#100C1D]/90 border border-[#2B1F4C]/80 shadow-2xl shadow-violet-950/40 backdrop-blur-lg";
      primary = "violet";
      secondary = "zinc";
      accent = "from-fuchsia-500 via-purple-600 to-cyan-400";
      textPrimary = "text-violet-50";
      textMuted = "text-violet-300/60";
      badgeStyle = "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/20";
      activeNavStyle = "bg-gradient-to-r from-violet-600/30 to-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400";
      fontFamily = "Plus Jakarta Sans, Syne, sans-serif";
      headingStyle = "font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-pink-200 to-cyan-200";
      bodyStyle = "text-sm text-violet-200/80";
      emphasis = "font-bold text-cyan-400";

      headline = "Live Stage Production Command & Crowd Telemetry";
      primaryMetric = { label: "Main Stage Status", value: "LIVE ON-AIR", trend: "98.2 dB sound compliance", icon: "Radio" };
      secondaryMetrics = [
        { label: "Artists On-Site & Checked-In", value: "34 / 38", trend: "Next: Neon Horizon 21:00", icon: "Mic" },
        { label: "Active Stage Capacity", value: "48,200 Fans", trend: "Main Arena 88% full", icon: "Users" },
        { label: "Production Cues Completed", value: "142 Cues", trend: "0 Technical delays", icon: "CheckCircle" },
      ];
      heroAction = { label: "+ Schedule Stage Performance", targetRoute: "/performances", icon: "Zap" };
      alerts = ["Sound check passed: Main Stage Subwoofers synchronized. Next performance: 20:45."];
      primaryWidget = "TIMELINE";
      components = ["ScheduleMatrix", "ShowcaseGrid", "Timeline", "TelemetryGrid"];
      antiPatterns.push("Corporate gray styling", "Boring data spreadsheets", "Subdued pastel beige", "Generic CRUD cards");
    }

    // B0-A. Artisanal Analog Synthesizers, Modular Acoustics & Sound Labs
    else if (rawText.includes("synthesizer") || rawText.includes("synth") || rawText.includes("oscillator") || rawText.includes("waveform") || rawText.includes("sound lab") || (rawText.includes("analog") && rawText.includes("audio")) || (rawText.includes("volt") && rawText.includes("velvet"))) {
      domain = "Artisanal Analog Synthesizers & Sound Lab";
      productType = "Instrument Monograph & Audition Studio";
      layoutFamily = "EDITORIAL_CATALOG";
      navStrategy = "TOPBAR_PILL";
      density = "spacious";
      formality = "luxury";
      mood = "Warm vintage velvet dark, brushed copper, rich walnut enclosures, glowing analog VU meters, and acoustic precision";

      mode = "warm_dark";
      bgClass = "bg-[#0A0A0C]";
      surfaceClass = "bg-[#141418]/80 border-[#2A2A34]";
      cardClass = "bg-[#181820]/90 border border-[#2A2A34]/80 shadow-xl shadow-black/60 backdrop-blur-md";
      primary = "amber";
      secondary = "zinc";
      accent = "from-amber-500 via-orange-500 to-rose-600";
      textPrimary = "text-amber-50";
      textMuted = "text-zinc-400";
      badgeStyle = "bg-amber-500/15 text-amber-300 border border-amber-500/30";
      activeNavStyle = "bg-amber-500/20 text-amber-200 border-b-2 border-amber-400";
      fontFamily = "Cinzel, Plus Jakarta Sans, monospace";
      headingStyle = "font-serif tracking-tight font-medium text-amber-50";
      bodyStyle = "text-sm text-zinc-300 font-light";
      emphasis = "font-medium text-amber-400";

      const brand = rawText.includes("volt & velvet") || rawText.includes("volt and velvet") ? "Volt & Velvet" : "Artisanal Synthesizer Lab";
      headline = `${brand} Analog Synthesizers & Acoustic Monograph`;
      primaryMetric = { label: "Custom Oscillators", value: "12 Modules", trend: "Discrete Transistor Core", icon: "Radio" };
      secondaryMetrics = [
        { label: "Harmonic Auditions", value: "36 Waveforms", trend: "Pure Analog Signal Path", icon: "Activity" },
        { label: "Wood Enclosures", value: "6 Finishes", trend: "Walnut, Teak, Cherry, Oak", icon: "Layers" },
        { label: "Master Artisans", value: "4 Luthiers", trend: "Hand-Calibrated in Workshop", icon: "Users" },
      ];
      heroAction = { label: "+ Audition Sound Oscillators", targetRoute: "/audition", icon: "Play" };
      alerts = ["Voltage-controlled filter batch calibration complete for discrete analog production line."];
      primaryWidget = "SHOWCASE";
      components = ["ShowcaseGrid", "AvailabilityGrid", "DocumentWorkspace"];
      antiPatterns.push("Generic SaaS blue", "Boring data spreadsheets", "Flashy neon cyberpunk styling", "Raw unstyled tables");
    }

    // B0-B. Heritage Craft Atelier / Artisan Studio & Contemporary Decor
    else if (rawText.includes("ceramic") || rawText.includes("lighting") || rawText.includes("pendant") || rawText.includes("pottery") || rawText.includes("stoneware") || rawText.includes("porcelain") || rawText.includes("handicraft") || rawText.includes("craft") || rawText.includes("brass") || rawText.includes("textile") || rawText.includes("decor") || rawText.includes("atelier") || rawText.includes("artisan") || (rawText.includes("kerala") && rawText.includes("brand"))) {
      domain = rawText.includes("ceramic") || rawText.includes("lighting") ? "Artisanal Ceramic Lighting Studio & Atelier" : rawText.includes("kerala") ? "Kerala Heritage Craft Atelier & Decor" : "Artisanal Craft Atelier & Contemporary Decor";
      productType = "Atelier Collection & Provenance Portal";
      layoutFamily = "EDITORIAL_CATALOG";
      navStrategy = "TOPBAR_PILL";
      density = "spacious";
      formality = "luxury";
      mood = "Rooted, refined, tactile, and editorial with warm dark bronze, hand-finished materials, and linen textures";

      mode = "warm_dark";
      bgClass = "bg-[#0D0B09]";
      surfaceClass = "bg-[#16130F]/80 border-[#2D241C]";
      cardClass = "bg-[#1C1813]/90 border border-[#2D241C]/80 shadow-xl shadow-black/50 backdrop-blur-md";
      primary = "amber";
      secondary = "stone";
      accent = "from-amber-500 via-orange-600 to-amber-700";
      textPrimary = "text-stone-100";
      textMuted = "text-stone-400";
      badgeStyle = "bg-amber-500/15 text-amber-300 border border-amber-500/30";
      activeNavStyle = "bg-amber-500/20 text-amber-200 border-b-2 border-amber-400";
      fontFamily = "Cinzel, Plus Jakarta Sans, serif";
      headingStyle = "font-serif tracking-normal font-medium text-stone-100";
      bodyStyle = "text-sm text-stone-300 font-light";
      emphasis = "font-medium text-amber-300";

      const regionPrefix = rawText.includes("kerala") ? "Kerala Heritage " : "Artisanal ";
      headline = `${regionPrefix}Craft Atelier & Guild Provenance`;
      primaryMetric = { label: "Guild Masterworks", value: "48 Artifacts", trend: "100% Provenance Certified", icon: "Sparkles" };
      secondaryMetrics = [
        { label: "Active Guilds", value: "8 Guilds", trend: "Master Artisan Provenance", icon: "Users" },
        { label: "Handcrafted Works", value: "14 Collections", trend: "Fair Trade Direct Dispatch", icon: "Package" },
        { label: "Bespoke Commissions", value: "6 Inquiries", trend: "Studio response < 24h", icon: "Mail" },
      ];
      heroAction = { label: "+ Discover Craft Collections", targetRoute: "/collections", icon: "Compass" };
      alerts = ["Artisan monograph updated with master craftsman lineage and provenance record."];
      primaryWidget = "SHOWCASE";
      components = ["ShowcaseGrid", "AvailabilityGrid", "DocumentWorkspace"];
      antiPatterns.push("Generic SaaS blue", "Boring data spreadsheets", "Flashy neon cyberpunk styling", "Raw unstyled tables");
    }

    // B. Hospitality / Luxury Hotel / Resort / Concierge
    else if (rawText.includes("hotel") || rawText.includes("resort") || rawText.includes("concierge") || rawText.includes("suite") || rawText.includes("lodging") || (rawText.includes("hospitality") && !rawText.includes("festival") && !rawText.includes("music"))) {
      domain = "Hospitality & Luxury Resort";
      productType = "Guest Experience & Reservation Suite";
      layoutFamily = "HOSPITALITY_PORTAL";
      navStrategy = "TOPBAR_PILL";
      density = "spacious";
      formality = "luxury";
      mood = "Warm, refined, opulent, and welcoming with champagne & dark bronze tones";

      mode = "warm_dark";
      bgClass = "bg-[#0E0C0A]";
      surfaceClass = "bg-[#181410]/80 border-[#2D241C]";
      cardClass = "bg-[#16120E]/90 border border-[#2D241C]/80 shadow-xl shadow-black/50 backdrop-blur-md";
      primary = "amber";
      secondary = "stone";
      accent = "from-amber-500 via-yellow-600 to-amber-700";
      textPrimary = "text-amber-50";
      textMuted = "text-stone-400";
      badgeStyle = "bg-amber-500/15 text-amber-300 border border-amber-500/30";
      activeNavStyle = "bg-amber-500/20 text-amber-200 border-b-2 border-amber-400";
      fontFamily = "Plus Jakarta Sans, Outfit, sans-serif";
      headingStyle = "font-serif tracking-normal font-medium text-amber-50";
      bodyStyle = "text-sm text-stone-300 font-light";
      emphasis = "font-medium text-amber-300";

      headline = "Sanctuary Operations & VIP Guest Registry";
      primaryMetric = { label: "Suite Occupancy Rate", value: "92.8%", trend: "+4.1% vs last week", icon: "Sparkles" };
      secondaryMetrics = [
        { label: "Today's VIP Arrivals", value: "18 Guests", trend: "4 Penthouse Bookings", icon: "Users" },
        { label: "Available Luxury Suites", value: "12 Suites", trend: "Immediate check-in", icon: "Home" },
        { label: "RevPAR Average", value: "$485", trend: "+12.4% yield", icon: "TrendingUp" },
      ];
      heroAction = { label: "+ Reserve Luxury Suite", targetRoute: "/reservations", icon: "Plus" };
      alerts = ["VIP Arrival scheduled: Presidential Suite (Arrival 15:30 PM). Executive concierge notified."];
      primaryWidget = "CALENDAR";
      components = ["AvailabilityGrid", "ShowcaseGrid", "Timeline", "StatusPipeline"];
      antiPatterns.push("Industrial dense telemetry", "Cold neon colors", "Generic SaaS blue", "Raw monospace tables");
    }

    // C. Legal Practice / Chambers / Law Firm / Court Litigations
    else if (rawText.includes("legal") || rawText.includes("law") || rawText.includes("court") || rawText.includes("litigation") || rawText.includes("chambers") || rawText.includes("hearing") || rawText.includes("attorney") || rawText.includes("casematter")) {
      domain = "Legal Practice & Litigation";
      productType = "Case Intelligence & Matter Workspace";
      layoutFamily = "WORKSPACE_SPLIT";
      navStrategy = "MINIMAL_DRAWER";
      density = "compact";
      formality = "professional";
      mood = "Authoritative, dignified, precise, and confidential with deep obsidian & brushed gold";

      mode = "deep_obsidian";
      bgClass = "bg-[#090A0E]";
      surfaceClass = "bg-[#11131A]/80 border-[#1E2230]";
      cardClass = "bg-[#0F1118]/90 border border-[#222738]/80 shadow-xl shadow-black/60";
      primary = "amber";
      secondary = "slate";
      accent = "from-amber-600 via-yellow-700 to-amber-800";
      textPrimary = "text-slate-100";
      textMuted = "text-slate-400";
      badgeStyle = "bg-amber-500/10 text-amber-300 border border-amber-500/25";
      activeNavStyle = "bg-amber-500/15 text-amber-200 border-l-2 border-amber-500";
      fontFamily = "Cinzel, Inter, Georgia, serif";
      headingStyle = "font-serif tracking-wide font-semibold text-slate-100";
      bodyStyle = "text-sm text-slate-300";
      emphasis = "font-medium text-amber-400";

      headline = "Master Matter Docket & Judicial Chambers";
      primaryMetric = { label: "Active Litigations", value: "47 Matters", trend: "8 High-stakes hearings", icon: "Scale" };
      secondaryMetrics = [
        { label: "Upcoming Court Hearings", value: "6 This Week", trend: "Next: Supreme Court 10:00", icon: "Calendar" },
        { label: "Billable Velocity", value: "184.5 hrs", trend: "+15.2% target pace", icon: "Clock" },
        { label: "Pending Filings & Briefs", value: "11 Documents", trend: "2 Due within 24h", icon: "FileText" },
      ];
      heroAction = { label: "+ Initiate Legal Case Matter", targetRoute: "/cases", icon: "FilePlus" };
      alerts = ["Brief deadline approaching: Motion to Dismiss due tomorrow at 17:00 EST."];
      primaryWidget = "WORKSPACE";
      components = ["DocumentWorkspace", "Timeline", "StatusPipeline"];
      antiPatterns.push("Playful bright colors", "Rounded bubbly cards", "Casual terminology", "Generic CRUD cards");
    }

    // C. Music Festival / Live Production / Entertainment / Tour
    else if (rawText.includes("music") || rawText.includes("festival") || rawText.includes("stage") || rawText.includes("artist") || rawText.includes("concert") || rawText.includes("soundwave") || rawText.includes("audio") || rawText.includes("performer")) {
      domain = "Music & Live Entertainment";
      productType = "Festival Operations & Stage Dispatch";
      layoutFamily = "MEDIA_SHOWCASE";
      navStrategy = "COMMAND_CONSOLE";
      density = "balanced";
      formality = "expressive";
      mood = "Electric, immersive, energetic, and high-impact with obsidian, cyan neon, and ultraviolet glows";

      mode = "neon_dark";
      bgClass = "bg-[#07060D]";
      surfaceClass = "bg-[#110D1F]/80 border-[#281E45]";
      cardClass = "bg-[#100C1D]/90 border border-[#2B1F4C]/80 shadow-2xl shadow-violet-950/40 backdrop-blur-lg";
      primary = "violet";
      secondary = "zinc";
      accent = "from-fuchsia-500 via-purple-600 to-cyan-400";
      textPrimary = "text-violet-50";
      textMuted = "text-violet-300/60";
      badgeStyle = "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/20";
      activeNavStyle = "bg-gradient-to-r from-violet-600/30 to-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400";
      fontFamily = "Plus Jakarta Sans, Syne, sans-serif";
      headingStyle = "font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-pink-200 to-cyan-200";
      bodyStyle = "text-sm text-violet-200/80";
      emphasis = "font-bold text-cyan-400";

      headline = "Live Stage Production Command & Crowd Telemetry";
      primaryMetric = { label: "Main Stage Status", value: "LIVE ON-AIR", trend: "98.2 dB sound compliance", icon: "Radio" };
      secondaryMetrics = [
        { label: "Artists On-Site & Checked-In", value: "34 / 38", trend: "Next: Neon Horizon 21:00", icon: "Mic" },
        { label: "Active Stage Capacity", value: "48,200 Fans", trend: "Main Arena 88% full", icon: "Users" },
        { label: "Production Cues Completed", value: "142 Cues", trend: "0 Technical delays", icon: "CheckCircle" },
      ];
      heroAction = { label: "+ Schedule Stage Performance", targetRoute: "/schedule", icon: "Zap" };
      alerts = ["Sound check passed: Main Stage Subwoofers synchronized. Next performance: 20:45."];
      primaryWidget = "TIMELINE";
      components = ["ScheduleMatrix", "ShowcaseGrid", "Timeline", "TelemetryGrid"];
      antiPatterns.push("Corporate gray styling", "Boring data spreadsheets", "Subdued pastel beige", "Generic CRUD cards");
    }

    // D0. Workflow / State-Machine / Lifecycle Pipeline (job / ticket / task / work order + lifecycle semantics)
    else if (
      (rawText.includes("job") || rawText.includes("ticket") || rawText.includes("work order") || rawText.includes("work-order") || rawText.includes("incident") || rawText.includes("dispatch")) &&
      (rawText.includes("status") || rawText.includes("service history") || rawText.includes("technician") || rawText.includes("part") || rawText.includes("close") || rawText.includes("sign-off") || rawText.includes("lifecycle") || rawText.includes("transition"))
    ) {
      domain = rawText.includes("emergency")
        ? "Emergency Operations & Equipment Readiness"
        : rawText.includes("incident")
        ? "Incident Response & Lifecycle Management"
        : "Operational Workflow & Service Pipeline";
      productType = "Stateful Workflow & Lifecycle Command Center";
      layoutFamily = "COMMAND_CENTER";
      navStrategy = "COMMAND_CONSOLE";
      density = "compact";
      formality = "technical";
      mood = "High-urgency operational dark terminal with safety amber warnings, tactical emerald readiness, and precision telemetry";

      mode = "dark";
      bgClass = "bg-[#0A0D12]";
      surfaceClass = "bg-[#10151E]/80 border-[#1B2330]";
      cardClass = "bg-[#0D1219]/90 border border-[#1E2636]/80 shadow-xl shadow-black/50";
      primary = "amber";
      secondary = "slate";
      accent = "from-amber-500 via-orange-600 to-red-600";
      textPrimary = "text-slate-100";
      textMuted = "text-slate-400";
      badgeStyle = "bg-amber-500/15 text-amber-300 border border-amber-500/30";
      activeNavStyle = "bg-amber-500/20 text-amber-200 border-l-2 border-amber-400";
      fontFamily = "JetBrains Mono, Plus Jakarta Sans, monospace";
      headingStyle = "font-mono tracking-tight font-bold text-slate-100";
      bodyStyle = "text-sm text-slate-300 font-mono";
      emphasis = "font-mono font-bold text-amber-400";

      headline = "Emergency Service Dispatch & Maintenance Operations";
      primaryMetric = { label: "Active Service Jobs", value: "6 In Queue", trend: "2 Critical priority", icon: "Activity" };
      secondaryMetrics = [
        { label: "Technician Utilization", value: "87.5%", trend: "4 Technicians on-duty", icon: "Users" },
        { label: "Parts In-Stock Index", value: "94.2%", trend: "1 Backorder requisitioned", icon: "Package" },
        { label: "First-Time Fix Rate", value: "91.8%", trend: "+3.2% vs SLA baseline", icon: "CheckCircle" },
      ];
      heroAction = { label: "+ Dispatch Maintenance Job", targetRoute: "/jobs", icon: "PlusCircle" };
      alerts = ["High Priority: Generator Unit E-42 pending technician sign-off."];
      primaryWidget = "KANBAN";
      components = ["WorkflowBoard", "StatusPipeline", "ActivityStream", "TelemetryGrid"];
      antiPatterns.push("Airy whitespace", "Generic SaaS blue", "Casual fonts", "Generic CRUD cards", "Inert modal buttons");
    }

    // D. Solar / Clean Energy / Power Grid / Inverter Telemetry
    else if (
      rawText.includes("solar") ||
      rawText.includes("inverter") ||
      rawText.includes("photovoltaic") ||
      rawText.includes("power output") ||
      rawText.includes("setpoint") ||
      (rawText.includes("telemetry") && (rawText.includes("energy") || rawText.includes("power") || rawText.includes("kw")))
    ) {
      domain = "Solar Array Telemetry & Power Analytics";
      productType = "Industrial Solar Telemetry & Grid Analytics Console";
      layoutFamily = "ANALYTICS_CONSOLE";
      navStrategy = artDirection.navigation.style;
      density = "compact";
      formality = "technical";
      mood = artDirection.layoutPersonality.mood;

      headline = "Solar Array Telemetry & Power Analytics Console";
      primaryMetric = { label: "Fleet Power Output", value: "3,840 kW", trend: "+2.4% vs diurnal forecast", icon: "Zap" };
      secondaryMetrics = [
        { label: "Total Target Demand", value: "3,900 kW", trend: "Tracking variance -60 kW", icon: "Target" },
        { label: "Array Avg Efficiency", value: "96.1%", trend: "Optimal MPPT tracking", icon: "Activity" },
        { label: "Peak Inverter Temp", value: "74.2°C", trend: "INV-03 thermal alert", icon: "Flame" },
      ];
      heroAction = { label: "+ Mutate Remote Setpoint", targetRoute: "/execute-remote-setpoint-mutation", icon: "Sliders" };
      alerts = ["Telemetry Alert: Inverter INV-03 thermal throttling active (74.2°C). Target setpoint adjustment recommended."];
      primaryWidget = "TELEMETRY";
      components = ["TelemetryGrid", "StatusPipeline", "ActivityStream"];
      antiPatterns.push("Airy whitespace", "Generic SaaS blue", "Casual fonts", "Generic CRUD cards");
    }

    // E. Logistics / Warehouse / Supply Chain / Fleet / Freight
    else if (rawText.includes("logistics") || rawText.includes("warehouse") || rawText.includes("fleet") || rawText.includes("supply") || rawText.includes("inventory") || rawText.includes("freight") || rawText.includes("truck") || rawText.includes("shipment")) {
      domain = "Logistics & Supply Chain Fulfillment";
      productType = "Industrial Telemetry & Fulfillment Hub";
      layoutFamily = "COMMAND_CENTER";
      navStrategy = artDirection.navigation.style;
      density = "compact";
      formality = "technical";
      mood = artDirection.layoutPersonality.mood;

      headline = "Warehouse Fulfillment Matrix & Telemetry Hub";
      primaryMetric = { label: "Fulfillment Velocity", value: "99.4%", trend: "+1.8% vs SLA target", icon: "TrendingUp" };
      secondaryMetrics = [
        { label: "Active Stock SKU Count", value: "14,820 SKUs", trend: "0 Out-of-stock criticals", icon: "Package" },
        { label: "Bin Capacity Utilization", value: "78.2%", trend: "Optimal slotting density", icon: "Grid" },
        { label: "Pending Dispatches & Transfers", value: "24 Shipments", trend: "All routes on schedule", icon: "Truck" },
      ];
      heroAction = { label: "+ Record Stock Inflow / Outflow", targetRoute: "/inventory", icon: "PlusSquare" };
      alerts = ["Fulfillment Gate 4: Fast-track pallet inbound complete. 150 units routed to Bin A-12."];
      primaryWidget = "TELEMETRY";
      components = ["TelemetryGrid", "StatusPipeline", "ActivityStream"];
      antiPatterns.push("Airy whitespace", "Generic SaaS blue", "Casual fonts", "Generic CRUD cards");
    }

    // E. Astrophotography / Quantum Lab / Space / Astronomy / Observatory
    else if (rawText.includes("astro") || rawText.includes("space") || rawText.includes("quantum") || rawText.includes("telescope") || rawText.includes("celestial") || rawText.includes("planet") || rawText.includes("observatory") || rawText.includes("observation session")) {
      domain = "Astrophotography & Deep Space Research";
      productType = "Celestial Observatory Console";
      layoutFamily = "CALENDAR_SCHEDULE";
      navStrategy = "COMMAND_CONSOLE";
      density = "compact";
      formality = "technical";
      mood = "Deep cosmic obsidian with starlight cyan & electric ultraviolet telemetry";

      mode = "deep_obsidian";
      bgClass = "bg-[#04060A]";
      surfaceClass = "bg-[#090D15]/80 border-[#141B2B]";
      cardClass = "bg-[#070B12]/90 border border-[#172136]/80 shadow-2xl shadow-cyan-950/30";
      primary = "cyan";
      secondary = "slate";
      accent = "from-cyan-400 via-blue-500 to-indigo-600";
      textPrimary = "text-cyan-50";
      textMuted = "text-cyan-300/60";
      badgeStyle = "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30";
      activeNavStyle = "bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400";
      fontFamily = "JetBrains Mono, Plus Jakarta Sans, monospace";
      headingStyle = "font-mono tracking-wider font-semibold text-cyan-100";
      bodyStyle = "text-sm text-cyan-200/80";
      emphasis = "font-mono text-cyan-300";

      headline = "Observatory Target Telemetry & Exposure Station";
      primaryMetric = { label: "Optical Tracking Alignment", value: "0.02 arcsec", trend: "Sub-pixel precision", icon: "Crosshair" };
      secondaryMetrics = [
        { label: "Deep-Sky Targets Queued", value: "8 Targets", trend: "Next: Andromeda Nebula M31", icon: "Eye" },
        { label: "Sensor Sensor Temp", value: "-15.0°C", trend: "Cooling locked (0 noise)", icon: "Thermometer" },
        { label: "FITS Exposures Captured", value: "412 Frames", trend: "Total integration: 14.8 hrs", icon: "Camera" },
      ];
      heroAction = { label: "+ Initiate Observation Session", targetRoute: "/observations", icon: "Disc" };
      alerts = ["Focuser auto-calibrated: Seeing conditions rated 0.8 arcsec (Superb)."];
      primaryWidget = "TELEMETRY";
      components = ["TelemetryGrid", "ShowcaseGrid", "Timeline", "StatusPipeline"];
      antiPatterns.push("Generic white themes", "Corporate blue headers", "Generic CRUD cards");
    }

    // F. Marine & Oceanographic Research / Maritime Expeditions
    else if (rawText.includes("ocean") || rawText.includes("marine") || rawText.includes("expedition") || rawText.includes("vessel") || rawText.includes("maritime") || rawText.includes("voyage") || rawText.includes("sampling") || rawText.includes("oceanographic") || rawText.includes("nautical") || rawText.includes("deepsea") || rawText.includes("sea")) {
      domain = "Marine & Oceanographic Research";
      productType = "Expedition Telemetry & Ocean Discovery Hub";
      layoutFamily = "COMMAND_CENTER";
      navStrategy = "DUAL_SIDEBAR";
      density = "balanced";
      formality = "professional";
      mood = "Abyssal deep ocean obsidian with bioluminescent teal, cyan bathymetry, and seafoam telemetry accents";

      mode = "dark";
      bgClass = "bg-[#020B14]";
      surfaceClass = "bg-[#061524]/80 border-[#0E2842]";
      cardClass = "bg-[#04111E]/90 border border-[#0F3050]/80 shadow-2xl shadow-cyan-950/30 backdrop-blur-md";
      primary = "teal";
      secondary = "slate";
      accent = "from-teal-400 via-cyan-500 to-emerald-600";
      textPrimary = "text-teal-50";
      textMuted = "text-cyan-200/60";
      badgeStyle = "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/20";
      activeNavStyle = "bg-gradient-to-r from-teal-600/25 to-cyan-500/20 text-cyan-200 border-l-2 border-teal-400";
      fontFamily = "Plus Jakarta Sans, Inter, sans-serif";
      headingStyle = "font-semibold tracking-tight text-teal-100";
      bodyStyle = "text-sm text-cyan-100/70";
      emphasis = "font-medium text-teal-300";

      headline = "Expedition Fleet Operations & Oceanographic Telemetry";
      primaryMetric = { label: "Active Research Voyages", value: "4 Expeditions", trend: "All vessels on-station", icon: "Compass" };
      secondaryMetrics = [
        { label: "CTD Profiles Logged", value: "1,842 Casts", trend: "+36 deep casts today", icon: "Waves" },
        { label: "Vessel Fleet Readiness", value: "100% Operational", trend: "0 Mechanical alerts", icon: "Anchor" },
        { label: "Sampling Specimens", value: "628 Findings", trend: "14 Novel benthic taxa", icon: "FlaskConical" },
      ];
      heroAction = { label: "+ Launch Expedition Mission", targetRoute: "/expeditions", icon: "Send" };
      alerts = ["R/V Pelagia reporting: Acoustic Doppler profiler calibrated. Bathymetric transect #12 active."];
      primaryWidget = "TELEMETRY";
      components = ["TelemetryGrid", "Timeline", "StatusPipeline", "ShowcaseGrid"];
      antiPatterns.push("Generic corporate blue", "Dry spreadsheet UI", "Generic CRUD cards");
    }

    // G. Healthcare / Clinical / Medical / Hospital
    else if (rawText.includes("health") || rawText.includes("clinic") || rawText.includes("medical") || rawText.includes("patient") || rawText.includes("doctor") || rawText.includes("hospital")) {
      domain = "Healthcare & Clinical Care";
      productType = "Clinical Intelligence & Patient Registry";
      layoutFamily = "WORKSPACE_SPLIT";
      navStrategy = "DUAL_SIDEBAR";
      density = "balanced";
      formality = "professional";
      mood = "Serene, trustworthy, high-contrast clinical dark slate with teal & cyan vital indicators";

      mode = "dark";
      bgClass = "bg-[#060D12]";
      surfaceClass = "bg-[#0B1720]/80 border-[#142A38]";
      cardClass = "bg-[#09141C]/90 border border-[#162F40]/80 shadow-lg shadow-teal-950/20";
      primary = "teal";
      secondary = "slate";
      accent = "from-teal-400 via-emerald-500 to-cyan-600";
      textPrimary = "text-teal-50";
      textMuted = "text-slate-400";
      badgeStyle = "bg-teal-500/10 text-teal-300 border border-teal-500/25";
      activeNavStyle = "bg-teal-500/15 text-teal-200 border-l-2 border-teal-400";
      fontFamily = "Inter, Plus Jakarta Sans, sans-serif";
      headingStyle = "tracking-tight font-semibold text-slate-100";
      bodyStyle = "text-sm text-slate-300";
      emphasis = "font-medium text-teal-400";

      headline = "Clinical Patient Intake & Vital Monitoring";
      primaryMetric = { label: "Patient Bed Occupancy", value: "84.2%", trend: "18 Available triage units", icon: "Activity" };
      secondaryMetrics = [
        { label: "Today's Consultations", value: "42 Patients", trend: "Average wait: 8 mins", icon: "Users" },
        { label: "Critical Care Vitals", value: "100% Stable", trend: "0 Elevated risk alerts", icon: "HeartPulse" },
        { label: "Lab Diagnostic Turnaround", value: "24 mins", trend: "-6 mins vs target", icon: "FileText" },
      ];
      heroAction = { label: "+ Register Patient Intake", targetRoute: "/patients", icon: "UserPlus" };
      alerts = ["Diagnostic report ready: Pathology screening for Bed 04 uploaded."];
      primaryWidget = "TIMELINE";
      components = ["Timeline", "StatusPipeline", "DocumentWorkspace"];
      antiPatterns.push("Generic CRUD card grids", "Unstyled forms", "Playful bright neon");
    }

    // H. Analytical Telemetry / Sensor Grid / Power Generation / IoT
    else if (
      (rawText.includes("telemetry") || rawText.includes("sensor") || rawText.includes("inverter") || rawText.includes("solar") || rawText.includes("grid") || rawText.includes("iot")) &&
      (rawText.includes("analytic") || rawText.includes("metric") || rawText.includes("aggregate") || rawText.includes("trend") || rawText.includes("timeseries") || rawText.includes("drill-down") || rawText.includes("drilldown") || rawText.includes("power") || rawText.includes("time window") || rawText.includes("setpoint"))
    ) {
      domain = "Industrial Telemetry & Sensor Analytics";
      productType = "High-Density Sensor Telemetry & Power Analytics Console";
      layoutFamily = "ANALYTICS_CONSOLE";
      navStrategy = "COMMAND_CONSOLE";
      density = "compact";
      formality = "technical";
      mood = "High-density industrial telemetry console with obsidian glass, emerald telemetry signals, and solar amber accents";

      mode = "dark";
      bgClass = "bg-[#070b0e]";
      surfaceClass = "bg-[#0c141a]/85 border-[#162733]";
      cardClass = "bg-[#091117]/90 border border-[#1b303f]/80 shadow-xl shadow-black/70";
      primary = "amber";
      secondary = "slate";
      accent = "from-amber-400 via-emerald-500 to-cyan-500";
      textPrimary = "text-amber-50";
      textMuted = "text-slate-400";
      badgeStyle = "bg-amber-500/10 text-amber-300 border border-amber-500/30";
      activeNavStyle = "bg-amber-500/20 text-amber-200 border-l-2 border-amber-400";
      fontFamily = "JetBrains Mono, Inter, monospace";
      headingStyle = "font-mono tracking-tight font-semibold text-amber-100";
      bodyStyle = "text-sm text-slate-300 font-mono";
      emphasis = "font-mono font-bold text-amber-400";

      headline = "Solar Array Telemetry & High-Density Inverter Analytics";
      primaryMetric = { label: "Total Measured Output", value: "3,840 kW", trend: "+3.8% above baseline", icon: "Zap" };
      secondaryMetrics = [
        { label: "Target Demand Setpoint", value: "3,900 kW", trend: "98.5% compliance", icon: "Target" },
        { label: "Array Fleet Efficiency", value: "96.4%", trend: "Optimal thermal envelope", icon: "TrendingUp" },
        { label: "Active Sensor Alerts", value: "1 Inverter", trend: "Thermal threshold alert", icon: "AlertTriangle" },
      ];
      heroAction = { label: "+ Calibrate Inverter Array", targetRoute: "/inverters", icon: "Sliders" };
      alerts = ["Sensor notice: Inverter INV-03 operating at 74°C (degraded thermal envelope)."];
      primaryWidget = "TELEMETRY";
      components = ["TelemetryGrid", "Timeline", "StatusPipeline", "MetricCluster"];
      antiPatterns.push("Generic CRUD card grids", "Unstyled forms", "Casual playful styling");
    }

    // I. Fintech / Trading / Asset Management / Banking
    else if (rawText.includes("fintech") || rawText.includes("trading") || rawText.includes("bank") || rawText.includes("crypto") || rawText.includes("portfolio") || rawText.includes("ledger") || rawText.includes("wallet") || rawText.includes("invest")) {
      domain = "Financial Markets & Asset Management";
      productType = "High-Frequency Portfolio & Settlement Console";
      layoutFamily = "ANALYTICS_CONSOLE";
      navStrategy = "COMMAND_CONSOLE";
      density = "compact";
      formality = "technical";
      mood = "High-precision dark terminal with emerald liquidity yields and graphite surfaces";

      mode = "dark";
      bgClass = "bg-[#05090C]";
      surfaceClass = "bg-[#0C1217]/80 border-[#15222B]";
      cardClass = "bg-[#091014]/90 border border-[#192832]/80 shadow-xl shadow-black/60";
      primary = "emerald";
      secondary = "slate";
      accent = "from-emerald-400 via-teal-500 to-green-600";
      textPrimary = "text-emerald-50";
      textMuted = "text-slate-400";
      badgeStyle = "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      activeNavStyle = "bg-emerald-500/20 text-emerald-200 border-l-2 border-emerald-400";
      fontFamily = "JetBrains Mono, Inter, monospace";
      headingStyle = "font-mono tracking-tight font-semibold text-emerald-100";
      bodyStyle = "text-sm text-slate-300 font-mono";
      emphasis = "font-mono font-bold text-emerald-400";

      headline = "Asset Liquidity & High-Frequency Settlement Desk";
      primaryMetric = { label: "Total Asset NAV", value: "$124.8M", trend: "+4.2% daily Alpha", icon: "DollarSign" };
      secondaryMetrics = [
        { label: "Active Yield Velocity", value: "18.4% APY", trend: "0 Liquidation risk", icon: "TrendingUp" },
        { label: "Pending Settlements", value: "32 Orders", trend: "T+0 instant clearing", icon: "CheckCircle" },
        { label: "Risk Exposure Index", value: "Low (0.12 Beta)", trend: "Fully hedged", icon: "ShieldCheck" },
      ];
      heroAction = { label: "+ Execute Trade Order", targetRoute: "/trades", icon: "ArrowRightLeft" };
      alerts = ["Settlement executed: $2.4M treasury hedge locked at 0.04% spread."];
      primaryWidget = "ANALYTICS";
      components = ["TelemetryGrid", "Timeline", "StatusPipeline"];
      antiPatterns.push("Casual playful styling", "Unrounded borders", "Generic CRUD cards");
    }

    return {
      productType,
      domain,
      artDirection,
      visualPersonality: {
        mood,
        density,
        formality,
      },
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
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
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
      antiPatterns,
      composition: (layoutFamily === "HOSPITALITY_PORTAL") ? {
        hero: {
          type: "sanctuary_showcase",
          title: headline,
          subtitle: "Exclusive luxury sanctuary suite registry & concierge operations",
          badge: "VIP Hospitality Mode",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "availability_matrix",
          title: "Suite Availability & Pricing Matrix",
          description: "Real-time occupancy status, room categories, and immediate reservation booking.",
          density: "spacious",
        },
        secondaryWorkspace: {
          type: "arrival_queue",
          title: "VIP Guest Arrivals & Flight Tracking",
        },
        supportingWidgets: [
          { type: "venue_capacity", title: "Dining & Wellness Spa Utilization" },
          { type: "metric_cluster", title: "Hospitality Revenue Yield" },
        ],
        interactionModel: "reservation_flow",
      } : (layoutFamily === "WORKSPACE_SPLIT") ? {
        hero: {
          type: "matter_header",
          title: headline,
          subtitle: "Confidential litigation docket & discovery workspace",
          badge: "Chambers Active Docket",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "master_detail",
          title: "Active Litigation Matters & Dossiers",
          description: "Split-view matter index with instant brief inspection and counsel assignment.",
          density: "compact",
        },
        secondaryWorkspace: {
          type: "chronological_timeline",
          title: "Judicial Court Hearings & Filing Deadlines",
        },
        supportingWidgets: [
          { type: "document_locker", title: "Discovery Filings & Retainer Ledger" },
          { type: "gauge_dial", title: "Billable Velocity Realization" },
        ],
        interactionModel: "case_dossier",
      } : (layoutFamily === "EDITORIAL_CATALOG") ? {
        hero: {
          type: "sanctuary_showcase",
          title: headline,
          subtitle: rawText.includes("synth") || rawText.includes("sound") || rawText.includes("oscillator")
            ? "Artisanal analog synthesizer laboratory & bespoke acoustic monograph"
            : `${domain} bespoke collection & provenance monograph`,
          badge: rawText.includes("synth") || rawText.includes("sound") ? "Analog Sound Lab" : "Atelier Collection",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "catalog_grid",
          title: rawText.includes("synth") || rawText.includes("sound") || rawText.includes("oscillator")
            ? "Modular Oscillator & Enclosure Collection"
            : "Masterworks Collection & Finish Matrix",
          description: rawText.includes("synth") || rawText.includes("sound") || rawText.includes("oscillator")
            ? "Discrete analog oscillator topologies, handcrafted wood finishes, and custom voice architectures."
            : `Handcrafted ${domain.toLowerCase()} collection, material finishes, and bespoke architectural specifications.`,
          density: "spacious",
        },
        secondaryWorkspace: {
          type: "financial_summary",
          title: "Bespoke Commissions & Atelier Intake",
        },
        supportingWidgets: [
          { type: "metric_cluster", title: rawText.includes("synth") || rawText.includes("sound") ? "Harmonic Waveform Spectrum" : "Material & Finish Integrity" },
          { type: "gauge_dial", title: "Craft Purity Index" },
        ],
        interactionModel: "general_operations",
      } : (layoutFamily === "MEDIA_SHOWCASE") ? {
        hero: {
          type: "live_stage_header",
          title: headline,
          subtitle: "Real-time live production dispatch & acoustics telemetry",
          badge: "LIVE BROADCAST",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "live_stage_matrix",
          title: "Live Stage Production Matrix",
          description: "Live sound decibels, artist set countdowns, and acoustic compliance monitoring.",
          density: "balanced",
        },
        secondaryWorkspace: {
          type: "dispatch_board",
          title: "Artist Rider Requests & Production Dispatch",
        },
        supportingWidgets: [
          { type: "telemetry_monitor", title: "Crowd Density Index" },
          { type: "sector_heatmap", title: "Stage Capacity Heatmap" },
        ],
        interactionModel: "live_dispatch",
      } : (layoutFamily === "CALENDAR_SCHEDULE") ? {
        hero: {
          type: "standard",
          title: headline,
          subtitle: "Celestial observation scheduling, sky-object catalogue & telescope reservation",
          badge: "Observatory Live Tonight",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "session_schedule",
          title: "Observation Session Schedule & Reservation",
          description: "Browse upcoming sessions, filter by date and celestial target, inspect telescopes, and reserve your observation slot.",
          density: "compact",
        },
        secondaryWorkspace: {
          type: "sky_object_catalogue",
          title: "Sky Object Catalogue & Target Browser",
        },
        supportingWidgets: [
          { type: "telescope_equipment", title: "Telescope & Equipment Registry" },
          { type: "astronomer_roster", title: "Resident Astronomer Profiles" },
        ],
        interactionModel: "session_reservation_flow",
      } : (primaryWidget === "KANBAN" || (layoutFamily === "COMMAND_CENTER" && (rawText.includes("job") || rawText.includes("ticket") || rawText.includes("work order") || rawText.includes("work-order") || rawText.includes("incident") || rawText.includes("dispatch")))) ? {
        hero: {
          type: "telemetry_banner",
          title: headline,
          subtitle: "State-machine lifecycle, technician dispatch & service operations",
          badge: "Command Center Active",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "workflow_board",
          title: "Active Jobs & State-Machine Pipeline",
          description: "Inspect active jobs, view service histories, mutate status, assign technicians, review required parts, and close completed jobs.",
          density: "compact",
          capabilities: [
            "inspect_record",
            "view_history",
            "mutate_status",
            "assign_resource",
            "verify_requirements",
            "complete_workflow"
          ]
        },
        secondaryWorkspace: {
          type: "status_pipeline",
          title: "Service History & Sign-off Ledger",
        },
        supportingWidgets: [
          { type: "telemetry_monitor", title: "Resource Assignment Pool" },
          { type: "metric_cluster", title: "Readiness Index" },
        ],
        interactionModel: "state_machine_execution",
      } : (layoutFamily === "ANALYTICS_CONSOLE" || primaryWidget === "TELEMETRY" || primaryWidget === "ANALYTICS") ? {
        hero: {
          type: "telemetry_banner",
          title: headline,
          subtitle: rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
            ? "Real-time high-density sensor telemetry, multi-dimensional power aggregation & operational setpoint control"
            : (rawText.includes("trading") || rawText.includes("fintech") || rawText.includes("portfolio") || rawText.includes("market")
                ? "Algorithmic execution monitoring, order book depth telemetry, and real-time VaR risk controls"
                : "Real-time high-density operational telemetry, multi-dimensional metrics & control console"),
          badge: rawText.includes("trading") || rawText.includes("fintech") || rawText.includes("portfolio")
            ? "Execution Desk Active"
            : (rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
                ? "Array Telemetry Active"
                : `${domain} Operations Active`),
          cta: heroAction,
        },
        primaryWorkspace: {
          type: (rawText.includes("telemetry") || rawText.includes("sensor") || rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")) ? "telemetry_grid" : "master_detail",
          title: rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
            ? "Solar Inverter Telemetry & Power Analytics Grid"
            : (rawText.includes("telemetry") || rawText.includes("sensor"))
                ? `${domain} Telemetry & Analytics Grid`
                : `${domain} Analytics & Portfolio Monitor`,
          description: rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic") || rawText.includes("telemetry") || rawText.includes("sensor")
            ? "Real-time sensor telemetry records, multi-dimensional power aggregation, time-window filtering, and unit drill-down."
            : "Real-time performance metrics, strategy execution tracking, and risk controls.",
          density: "compact",
          capabilities: [
            "ingest_records",
            "aggregate_metrics",
            "filter_time_window",
            "visualize_trends",
            "drilldown_timeseries",
            "recalculate_aggregations"
          ]
        },
        secondaryWorkspace: {
          type: "status_pipeline",
          title: rawText.includes("trading") || rawText.includes("fintech")
            ? "Strategy Execution & Order Fill Ledger"
            : (rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
                ? "Grid Power Dispatch & Event Ledger"
                : `${domain} Event & Activity Ledger`),
        },
        supportingWidgets: [
          {
            type: "telemetry_monitor",
            title: rawText.includes("trading") || rawText.includes("fintech")
              ? "Real-Time Execution Stream"
              : (rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
                  ? "Inverter Telemetry Stream"
                  : `${domain} Activity Stream`),
          },
          {
            type: "metric_cluster",
            title: rawText.includes("trading") || rawText.includes("fintech")
              ? "Alpha & Sharpe Performance Index"
              : (rawText.includes("solar") || rawText.includes("inverter") || rawText.includes("photovoltaic")
                  ? "Power Performance Index"
                  : `${domain} Performance Index`),
          },
        ],
        interactionModel: "telemetry_command",
      } : {
        hero: {
          type: "telemetry_banner",
          title: headline,
          subtitle: "Autonomous operational telemetry & mission dispatch hub",
          badge: "Mission Control Active",
          cta: heroAction,
        },
        primaryWorkspace: {
          type: "telemetry_grid",
          title: "Mission Telemetry & Fleet Status",
          description: "High-density sensor monitoring and real-time voyage coordination.",
          density: "compact",
        },
        secondaryWorkspace: {
          type: "status_pipeline",
          title: "Expedition Mission Dispatch Stream",
        },
        supportingWidgets: [
          { type: "telemetry_monitor", title: "Telemetry Stream" },
          { type: "metric_cluster", title: "Readiness Index" },
        ],
        interactionModel: "telemetry_command",
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


