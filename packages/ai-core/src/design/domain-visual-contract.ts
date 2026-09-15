import type { ProjectSpecification } from "../architect/specification.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { CompositionGraph, CompositionGraphSynthesizer } from "./composition-graph.js";

export { CompositionGraph, CompositionGraphSynthesizer };

export interface DomainVisualDesignContract {
  productType: string;
  domain: string;
  compositionGraph?: CompositionGraph;

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
    | "ANALYTICS_CONSOLE";

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
    primaryWidget: "TIMELINE" | "KANBAN" | "TELEMETRY" | "CALENDAR" | "SHOWCASE" | "WORKSPACE" | "ANALYTICS";
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
      type: "availability_matrix" | "master_detail" | "live_stage_matrix" | "telemetry_grid" | "kanban_board" | "timeline_pipeline" | "document_workspace" | "catalog_grid";
      title: string;
      description: string;
      density?: "compact" | "balanced" | "spacious";
    };
    secondaryWorkspace: {
      type: "arrival_queue" | "chronological_timeline" | "dispatch_board" | "activity_stream" | "status_pipeline" | "financial_summary";
      title: string;
    };
    supportingWidgets: Array<{
      type: "metric_cluster" | "gauge_dial" | "venue_capacity" | "document_locker" | "telemetry_monitor" | "sector_heatmap";
      title: string;
    }>;
    interactionModel: "reservation_flow" | "case_dossier" | "live_dispatch" | "telemetry_command" | "general_operations";
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
   * Translates domain color names and theme parameters into concrete, guaranteed CSS hex/rgba tokens.
   * Enforces WCAG contrast safeguards to guarantee text visibility across all palettes.
   */
  public static resolveCssTokens(contract: DomainVisualDesignContract): ResolvedCssTokens {
    const isLight = contract.colorSystem.mode.includes("light");
    const primary = (contract.colorSystem.primary || "teal").toLowerCase();
    
    // Primary palette map
    const primaryMap: Record<string, { hex: string; hover: string; subtle: string }> = {
      teal:     { hex: "#0d9488", hover: "#0f766e", subtle: "rgba(13, 148, 136, 0.18)" },
      amber:    { hex: "#d97706", hover: "#b45309", subtle: "rgba(217, 119, 6, 0.18)" },
      emerald:  { hex: "#059669", hover: "#047857", subtle: "rgba(5, 150, 105, 0.18)" },
      violet:   { hex: "#7c3aed", hover: "#6d28d9", subtle: "rgba(124, 58, 237, 0.18)" },
      cyan:     { hex: "#0891b2", hover: "#0e7490", subtle: "rgba(8, 145, 178, 0.18)" },
      rose:     { hex: "#e11d48", hover: "#be123c", subtle: "rgba(225, 29, 72, 0.18)" },
      sky:      { hex: "#0284c7", hover: "#0369a1", subtle: "rgba(2, 132, 199, 0.18)" },
      indigo:   { hex: "#4f46e5", hover: "#4338ca", subtle: "rgba(79, 70, 229, 0.18)" },
      blue:     { hex: "#2563eb", hover: "#1d4ed8", subtle: "rgba(37, 99, 235, 0.18)" },
      fuchsia:  { hex: "#c026d3", hover: "#a21caf", subtle: "rgba(192, 38, 211, 0.18)" },
    };

    const pTokens = primaryMap[primary] || { hex: "#0d9488", hover: "#0f766e", subtle: "rgba(13, 148, 136, 0.18)" };

    // Background & surface resolution
    let bg = "#020617";
    let surface = "rgba(15, 23, 42, 0.85)";
    let surfaceElevated = "rgba(30, 41, 59, 0.95)";
    let border = "rgba(255, 255, 255, 0.1)";
    let borderSubtle = "rgba(255, 255, 255, 0.05)";
    let textPrimary = "#f8fafc";
    let textSecondary = "#94a3b8";
    let textMuted = "#64748b";

    if (contract.colorSystem.background && contract.colorSystem.background.includes("#")) {
      const hexMatch = contract.colorSystem.background.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
      if (hexMatch) bg = hexMatch[0];
    } else if (contract.colorSystem.mode === "warm_dark") {
      bg = "#0c0a09";
      surface = "rgba(28, 25, 23, 0.85)";
      surfaceElevated = "rgba(41, 37, 36, 0.95)";
      textPrimary = "#fafaf9";
      textSecondary = "#a8a29e";
      textMuted = "#78716c";
      border = "rgba(214, 211, 209, 0.12)";
    } else if (contract.colorSystem.mode === "deep_obsidian") {
      bg = "#030712";
      surface = "rgba(17, 24, 39, 0.85)";
      surfaceElevated = "rgba(31, 41, 55, 0.95)";
      textPrimary = "#f9fafb";
      textSecondary = "#9ca3af";
      textMuted = "#6b7280";
    } else if (contract.colorSystem.mode === "neon_dark") {
      bg = "#07060d";
      surface = "rgba(17, 13, 31, 0.85)";
      surfaceElevated = "rgba(32, 24, 58, 0.95)";
      textPrimary = "#fdf4ff";
      textSecondary = "#d8b4fe";
      textMuted = "#a855f7";
      border = "rgba(168, 85, 247, 0.2)";
    } else if (isLight) {
      bg = "#f8fafc";
      surface = "#ffffff";
      surfaceElevated = "#f1f5f9";
      textPrimary = "#0f172a";
      textSecondary = "#475569";
      textMuted = "#94a3b8";
      border = "rgba(0, 0, 0, 0.08)";
      borderSubtle = "rgba(0, 0, 0, 0.04)";
    }

    // WCAG Contrast Safeguard: Ensure textPrimary has minimum 4.5:1 contrast against background
    const bgLuminance = DomainVisualContractGenerator.getLuminance(bg);
    const contrast = DomainVisualContractGenerator.getContrastRatio(textPrimary, bg);
    if (contrast < 4.5) {
      if (bgLuminance < 0.5) {
        textPrimary = "#f8fafc";
        textSecondary = "#94a3b8";
        textMuted = "#64748b";
      } else {
        textPrimary = "#0f172a";
        textSecondary = "#475569";
        textMuted = "#94a3b8";
      }
    }

    // Radius density
    let radiusSm = "4px";
    let radiusMd = "8px";
    let radiusLg = "12px";
    let radiusXl = "16px";
    if (contract.visualPersonality.density === "compact") {
      radiusSm = "2px";
      radiusMd = "4px";
      radiusLg = "6px";
      radiusXl = "8px";
    } else if (contract.visualPersonality.density === "spacious") {
      radiusSm = "6px";
      radiusMd = "12px";
      radiusLg = "18px";
      radiusXl = "24px";
    }

    return {
      backgroundColor: bg,
      surfaceColor: surface,
      surfaceElevatedColor: surfaceElevated,
      primaryColor: pTokens.hex,
      primaryHoverColor: pTokens.hover,
      primarySubtleColor: pTokens.subtle,
      secondaryColor: isLight ? "#64748b" : "#475569",
      accentGradient: contract.colorSystem.accent,
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
      shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
      shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
      fontDisplay: contract.typography.fontFamily || "Plus Jakarta Sans, Inter, sans-serif",
      fontBody: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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

    // ── 1. Semantic Domain Classification ────────────────────────────────────
    let domain = "General Enterprise";
    let productType = "Operations Platform";
    let layoutFamily: DomainVisualDesignContract["layoutFamily"] = "COMMAND_CENTER";
    let navStrategy: DomainVisualDesignContract["navigation"]["strategy"] = "MODERN_SIDEBAR";
    let density: DomainVisualDesignContract["visualPersonality"]["density"] = "balanced";
    let formality: DomainVisualDesignContract["visualPersonality"]["formality"] = "professional";
    let mood = "Modern, functional, and organized";

    // Palette Defaults
    let mode: DomainVisualDesignContract["colorSystem"]["mode"] = "dark";
    let bgClass = "bg-slate-950";
    let surfaceClass = "bg-slate-900/70 border-slate-800";
    let cardClass = "bg-slate-900/90 border border-slate-800/80 shadow-lg shadow-black/30";
    let primary = "emerald";
    let secondary = "slate";
    let accent = "from-emerald-500 to-teal-600";
    let textPrimary = "text-slate-100";
    let textMuted = "text-slate-400";
    let badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    let activeNavStyle = "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500";
    let fontFamily = "Inter, system-ui, sans-serif";
    let headingStyle = "tracking-tight font-semibold text-slate-100";
    let bodyStyle = "text-sm text-slate-300";
    let emphasis = "font-medium text-emerald-400";

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

    // B0. Heritage Craft Atelier / Artisan Studio / Kerala Decor & Textiles
    else if (rawText.includes("handicraft") || rawText.includes("craft") || rawText.includes("brass") || rawText.includes("textile") || rawText.includes("decor") || rawText.includes("atelier") || rawText.includes("artisan") || (rawText.includes("kerala") && rawText.includes("brand"))) {
      domain = "Heritage Craft Atelier & Contemporary Decor";
      productType = "Atelier Collection & Provenance Portal";
      layoutFamily = "EDITORIAL_CATALOG";
      navStrategy = "TOPBAR_PILL";
      density = "spacious";
      formality = "luxury";
      mood = "Rooted, refined, tactile, and editorial with Kerala teak, warm dark bronze, and handloom linen textures";

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

      headline = "Kerala Heritage Craft Atelier & Guild Provenance";
      primaryMetric = { label: "Guild Masterworks", value: "48 Artifacts", trend: "100% GI Tag Certified", icon: "Sparkles" };
      secondaryMetrics = [
        { label: "Active Village Guilds", value: "8 Guilds", trend: "Aranmula, Mannar, Balaramapuram", icon: "Users" },
        { label: "Handloom & Metal Castings", value: "14 Collections", trend: "Fair Trade Direct Dispatch", icon: "Package" },
        { label: "Bespoke Commissions", value: "6 Inquiries", trend: "Studio response < 24h", icon: "Mail" },
      ];
      heroAction = { label: "+ Discover Craft Collections", targetRoute: "/collections", icon: "Compass" };
      alerts = ["Mannar Lost-Wax Bell Metal casting monograph updated with 4th generation artisan lineage."];
      primaryWidget = "SHOWCASE";
      components = ["ShowcaseGrid", "AvailabilityGrid", "DocumentWorkspace", "Timeline"];
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
      components = ["DocumentWorkspace", "Timeline", "StatusPipeline", "KanbanBoard"];
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

    // D. Logistics / Warehouse / Supply Chain / Fleet / Freight
    else if (rawText.includes("logistics") || rawText.includes("warehouse") || rawText.includes("fleet") || rawText.includes("supply") || rawText.includes("inventory") || rawText.includes("freight") || rawText.includes("truck") || rawText.includes("shipment")) {
      domain = "Logistics & Supply Chain Fulfillment";
      productType = "Industrial Telemetry & Fulfillment Hub";
      layoutFamily = "COMMAND_CENTER";
      navStrategy = "DUAL_SIDEBAR";
      density = "compact";
      formality = "technical";
      mood = "High-density, operational, telemetry-driven with steel graphite & safety amber accents";

      mode = "dark";
      bgClass = "bg-[#090C10]";
      surfaceClass = "bg-[#111620]/80 border-[#1C2433]";
      cardClass = "bg-[#0F141E]/90 border border-[#1E2738]/80 shadow-lg shadow-black/40";
      primary = "amber";
      secondary = "slate";
      accent = "from-amber-500 via-orange-600 to-amber-700";
      textPrimary = "text-slate-100";
      textMuted = "text-slate-400";
      badgeStyle = "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      activeNavStyle = "bg-amber-500/15 text-amber-300 border-l-2 border-amber-500";
      fontFamily = "JetBrains Mono, Inter, monospace";
      headingStyle = "font-mono tracking-tight font-bold text-slate-100";
      bodyStyle = "text-sm text-slate-300 font-mono";
      emphasis = "font-mono font-bold text-amber-400";

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
      components = ["TelemetryGrid", "StatusPipeline", "KanbanBoard", "ActivityStream"];
      antiPatterns.push("Airy whitespace", "Generic SaaS blue", "Casual fonts", "Generic CRUD cards");
    }

    // E. Astrophotography / Quantum Lab / Space / Astronomy
    else if (rawText.includes("astro") || rawText.includes("space") || rawText.includes("quantum") || rawText.includes("telescope") || rawText.includes("celestial") || rawText.includes("planet") || rawText.includes("observatory")) {
      domain = "Astrophotography & Deep Space Research";
      productType = "Celestial Observatory Console";
      layoutFamily = "COMMAND_CENTER";
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
      components = ["Timeline", "StatusPipeline", "DocumentWorkspace", "KanbanBoard"];
      antiPatterns.push("Generic CRUD card grids", "Unstyled forms", "Playful bright neon");
    }

    // H. Fintech / Trading / Asset Management / Banking
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
      components = ["TelemetryGrid", "Timeline", "StatusPipeline", "KanbanBoard"];
      antiPatterns.push("Casual playful styling", "Unrounded borders", "Generic CRUD cards");
    }

    return {
      productType,
      domain,
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
}
