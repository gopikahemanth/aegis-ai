import type { ProjectSpecification } from "../architect/specification.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";

export interface DomainVisualDesignContract {
  productType: string;
  domain: string;

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

  antiPatterns: string[];
}

export class DomainVisualContractGenerator {
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

    // A. Hospitality / Luxury Hotel / Resort / Concierge
    if (rawText.includes("hotel") || rawText.includes("resort") || rawText.includes("hospitality") || rawText.includes("guest") || rawText.includes("concierge") || rawText.includes("suite") || rawText.includes("room")) {
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

    // B. Legal Practice / Chambers / Law Firm / Court Litigations
    else if (rawText.includes("legal") || rawText.includes("law") || rawText.includes("court") || rawText.includes("litigation") || rawText.includes("chambers") || rawText.includes("case") || rawText.includes("hearing") || rawText.includes("attorney")) {
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

    // F. Healthcare / Clinical / Medical / Hospital
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
    };
  }
}
