/**
 * CompositionGraph
 *
 * First-class Intermediate Representation (IR) for user interface architecture in Aegis AI.
 * Explicitly separates:
 *   1. WHAT should exist?    -> CompositionGraph (Topology, Focus Regions, Widgets, Action Nodes)
 *   2. HOW should it look?   -> DomainVisualDesignContract & Design Tokens
 *   3. HOW should it behave? -> InteractionModel & Reducer/Store Actions
 *   4. DOES it work?         -> Verification Engine (Source, Build, Runtime, Browser)
 */

export type LayoutTopologyType =
  | "PORTAL_HERO_SHOWCASE"
  | "ASYMMETRIC_SPLIT_PANE"
  | "OPERATIONAL_COMMAND_CONSOLE"
  | "ANALYTICS_METRIC_MATRIX"
  | "CHRONOLOGICAL_TIMELINE_RAIL"
  | "COLLABORATIVE_KANBAN_BOARD";

export type UXIntentType =
  | "TRANSACT_BROWSE"
  | "INSPECT_MANAGE"
  | "MONITOR_CONTROL"
  | "DISPATCH_COORDINATE"
  | "ANALYZE_DISCOVER"
  | "CREATE_AUTHOR";

export type FocusDensity = "compact" | "balanced" | "spacious";

export type PrimaryFocusType =
  | "availability_matrix"
  | "master_detail"
  | "live_stage_matrix"
  | "telemetry_grid"
  | "kanban_board"
  | "timeline_pipeline"
  | "document_workspace"
  | "catalog_grid"
  | "dispatch_matrix";

export type SecondaryFocusType =
  | "arrival_queue"
  | "chronological_timeline"
  | "dispatch_board"
  | "activity_stream"
  | "status_pipeline"
  | "financial_summary"
  | "sensor_readout";

export interface RegionNode {
  id: string;
  role: "hero" | "primary" | "secondary" | "aside" | "footer";
  gridSpan: { cols: number; rows?: number };
  density: FocusDensity;
}

export interface WidgetNode {
  id: string;
  type: string;
  title: string;
  regionId: string;
  refreshIntervalMs?: number;
}

export interface InteractionNode {
  trigger: "click" | "hover" | "submit" | "select";
  target: string;
  action: "open_modal" | "filter_feed" | "navigate" | "mutate_record" | "inspect_detail";
  description: string;
}

export interface ResponsiveStrategy {
  desktop: "grid-12-col" | "split-5-7" | "metric-matrix-4" | "command-console-3";
  tablet: "stack-vertical-split" | "grid-2-col" | "drawer-toggle";
  mobile: "single-column-flow" | "bottom-sheet-nav" | "accordion-cards";
}

export interface CompositionGraph {
  intent: UXIntentType;
  topology: {
    type: LayoutTopologyType;
    regions: RegionNode[];
  };
  primaryFocus: {
    type: PrimaryFocusType;
    entity: string;
    title: string;
    description: string;
    density: FocusDensity;
  };
  secondaryFocus?: {
    type: SecondaryFocusType;
    entity?: string;
    title: string;
  };
  widgets: WidgetNode[];
  interactions: InteractionNode[];
  responsiveStrategy: ResponsiveStrategy;
}

export class CompositionGraphSynthesizer {
  /**
   * Derives UX Intent from prompt keywords and workflow characteristics.
   */
  public static deriveIntent(prompt: string): UXIntentType {
    const p = prompt.toLowerCase();
    if (p.includes("reserve") || p.includes("book") || p.includes("hotel") || p.includes("resort") || p.includes("yacht") || p.includes("charter") || p.includes("order") || p.includes("checkout")) {
      return "TRANSACT_BROWSE";
    }
    if (p.includes("legal") || p.includes("law") || p.includes("court") || p.includes("litigation") || p.includes("dossier") || p.includes("case") || p.includes("compliance") || p.includes("audit")) {
      return "INSPECT_MANAGE";
    }
    if (p.includes("festival") || p.includes("stage") || p.includes("sound") || p.includes("broadcast") || p.includes("live") || p.includes("concert")) {
      return "MONITOR_CONTROL";
    }
    if (p.includes("rail") || p.includes("transit") || p.includes("train") || p.includes("fleet") || p.includes("dispatch") || p.includes("expedition") || p.includes("antarctic") || p.includes("flight") || p.includes("vessel")) {
      return "DISPATCH_COORDINATE";
    }
    if (p.includes("film") || p.includes("studio") || p.includes("shoot") || p.includes("cinema") || p.includes("creative") || p.includes("conservation") || p.includes("architecture")) {
      return "CREATE_AUTHOR";
    }
    return "ANALYZE_DISCOVER";
  }

  /**
   * Synthesizes a validated CompositionGraph from UX intent and domain workflow extraction.
   */
  public static synthesize(
    prompt: string,
    domain?: string,
    layoutFamily?: string
  ): CompositionGraph {
    const intent = CompositionGraphSynthesizer.deriveIntent(prompt);
    const text = `${prompt} ${domain || ""} ${layoutFamily || ""}`.toLowerCase();

    // 1. TRANSACT_BROWSE (Resort, Yacht Charter, Luxury Travel, Bookings)
    if (intent === "TRANSACT_BROWSE" || text.includes("yacht") || text.includes("charter") || text.includes("resort")) {
      const isYacht = text.includes("yacht") || text.includes("charter") || text.includes("fleet");
      return {
        intent: "TRANSACT_BROWSE",
        topology: {
          type: "PORTAL_HERO_SHOWCASE",
          regions: [
            { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "spacious" },
            { id: "primary", role: "primary", gridSpan: { cols: 12 }, density: "spacious" },
            { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
          ],
        },
        primaryFocus: {
          type: "availability_matrix",
          entity: isYacht ? "VesselCharter" : "SuiteReservation",
          title: isYacht ? "Fleet Charter Availability & Berthing Matrix" : "Suite & Inventory Availability Matrix",
          description: isYacht ? "Live charter vessel readiness, cabin tiers, and instant charter booking." : "Real-time tier capacity, reservation slots, and immediate booking engine.",
          density: "spacious",
        },
        secondaryFocus: {
          type: "arrival_queue",
          entity: isYacht ? "CharterEmbarkation" : "VIPArrival",
          title: isYacht ? "Embarkation & Port Departure Schedule" : "VIP Arrivals & Concierge Queue",
        },
        widgets: [
          { id: "w1", type: "capacity_gauge", title: isYacht ? "Charter Fleet Utilization" : "Occupancy Index", regionId: "hero" },
          { id: "w2", type: "amenity_utilization", title: isYacht ? "Berth Allocation" : "Amenity Utilization", regionId: "secondary" },
        ],
        interactions: [
          { trigger: "click", target: isYacht ? "+ Charter Luxury Vessel" : "+ Reserve Luxury Suite", action: "open_modal", description: "Opens instant reservation flow" },
          { trigger: "select", target: "filter_status", action: "filter_feed", description: "Filters guest activity stream" },
        ],
        responsiveStrategy: {
          desktop: "grid-12-col",
          tablet: "grid-2-col",
          mobile: "single-column-flow",
        },
      };
    }

    // 2. INSPECT_MANAGE (Legal, Litigation, Judicial Chambers, Regulatory Dossiers)
    if (intent === "INSPECT_MANAGE" || text.includes("law") || text.includes("court") || text.includes("matter")) {
      return {
        intent: "INSPECT_MANAGE",
        topology: {
          type: "ASYMMETRIC_SPLIT_PANE",
          regions: [
            { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "balanced" },
            { id: "primary_docket", role: "primary", gridSpan: { cols: 5 }, density: "compact" },
            { id: "primary_dossier", role: "primary", gridSpan: { cols: 7 }, density: "balanced" },
            { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
          ],
        },
        primaryFocus: {
          type: "master_detail",
          entity: "CaseMatter",
          title: "Active Litigation Docket & Case Briefs",
          description: "Split-view matter index with instant brief inspection and counsel assignment.",
          density: "compact",
        },
        secondaryFocus: {
          type: "chronological_timeline",
          entity: "JudicialHearing",
          title: "Judicial Hearing & Filing Timeline",
        },
        widgets: [
          { id: "w1", type: "financial_gauge", title: "Retainer Realization", regionId: "hero" },
          { id: "w2", type: "document_locker", title: "Discovery Filings", regionId: "primary_dossier" },
        ],
        interactions: [
          { trigger: "click", target: "+ Initiate Legal Case Matter", action: "open_modal", description: "Opens matter intake form" },
          { trigger: "click", target: "matter_row", action: "inspect_detail", description: "Updates active evidence brief" },
        ],
        responsiveStrategy: {
          desktop: "split-5-7",
          tablet: "stack-vertical-split",
          mobile: "single-column-flow",
        },
      };
    }

    // 3. MONITOR_CONTROL (Music Festival, Stage Production, Live Event Ops)
    if (intent === "MONITOR_CONTROL" || text.includes("stage") || text.includes("festival") || text.includes("concert")) {
      return {
        intent: "MONITOR_CONTROL",
        topology: {
          type: "OPERATIONAL_COMMAND_CONSOLE",
          regions: [
            { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "compact" },
            { id: "primary", role: "primary", gridSpan: { cols: 12 }, density: "compact" },
            { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "compact" },
          ],
        },
        primaryFocus: {
          type: "live_stage_matrix",
          entity: "LiveStage",
          title: "Live Stage Production Matrix",
          description: "Real-time acoustic decibel monitoring, artist countdowns, and stage capacity.",
          density: "compact",
        },
        secondaryFocus: {
          type: "dispatch_board",
          entity: "StageCrew",
          title: "Stage Crew & Emergency Dispatch",
        },
        widgets: [
          { id: "w1", type: "decibel_meter", title: "Acoustic Telemetry", regionId: "primary", refreshIntervalMs: 1000 },
          { id: "w2", type: "crowd_density", title: "Zone Density", regionId: "primary" },
        ],
        interactions: [
          { trigger: "click", target: "+ Schedule Stage Performance", action: "open_modal", description: "Opens performance scheduler" },
          { trigger: "click", target: "override_stage", action: "mutate_record", description: "Dispatches emergency audio attenuation" },
        ],
        responsiveStrategy: {
          desktop: "command-console-3",
          tablet: "grid-2-col",
          mobile: "single-column-flow",
        },
      };
    }

    // 4. DISPATCH_COORDINATE (Rail Operations, Antarctic Expeditions, Fleet Coordination)
    if (intent === "DISPATCH_COORDINATE" || text.includes("rail") || text.includes("expedition") || text.includes("antarctic") || text.includes("train")) {
      const isRail = text.includes("rail") || text.includes("train");
      return {
        intent: "DISPATCH_COORDINATE",
        topology: {
          type: "OPERATIONAL_COMMAND_CONSOLE",
          regions: [
            { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "compact" },
            { id: "primary", role: "primary", gridSpan: { cols: 12 }, density: "compact" },
            { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
          ],
        },
        primaryFocus: {
          type: "telemetry_grid",
          entity: isRail ? "TrainRoute" : "ExpeditionVessel",
          title: isRail ? "High-Speed Rail Corridor & Track Telemetry" : "Antarctic Expedition Waypoint Telemetry",
          description: isRail ? "Real-time train velocity, block signaling, switch interlocking, and delay tracking." : "Live GPS waypoint coordinates, ice-shelf thickness, weather telemetry, and crew vital signs.",
          density: "compact",
        },
        secondaryFocus: {
          type: "status_pipeline",
          entity: isRail ? "SwitchInterlocking" : "SupplyRation",
          title: isRail ? "Track Dispatch & Signal Override Stream" : "Field Research Dispatch & Survival Telemetry",
        },
        widgets: [
          { id: "w1", type: "velocity_gauge", title: isRail ? "Corridor On-Time Index" : "Expedition Range Index", regionId: "hero" },
          { id: "w2", type: "telemetry_monitor", title: isRail ? "Signal Block Monitor" : "Sub-Zero Temperature Monitor", regionId: "primary" },
        ],
        interactions: [
          { trigger: "click", target: isRail ? "+ Dispatch High-Speed Train" : "+ Log Expedition Waypoint", action: "open_modal", description: "Opens dispatch controller" },
          { trigger: "select", target: "filter_status", action: "filter_feed", description: "Filters active telemetry channel" },
        ],
        responsiveStrategy: {
          desktop: "command-console-3",
          tablet: "stack-vertical-split",
          mobile: "single-column-flow",
        },
      };
    }

    // 5. CREATE_AUTHOR (Film Production Studio, Architectural Conservation Studio)
    if (intent === "CREATE_AUTHOR" || text.includes("film") || text.includes("studio") || text.includes("architecture") || text.includes("conservation")) {
      const isFilm = text.includes("film") || text.includes("studio") || text.includes("cinema");
      return {
        intent: "CREATE_AUTHOR",
        topology: {
          type: "ASYMMETRIC_SPLIT_PANE",
          regions: [
            { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "balanced" },
            { id: "primary_catalog", role: "primary", gridSpan: { cols: 7 }, density: "balanced" },
            { id: "primary_detail", role: "primary", gridSpan: { cols: 5 }, density: "compact" },
            { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
          ],
        },
        primaryFocus: {
          type: "master_detail",
          entity: isFilm ? "ProductionShoot" : "HistoricStructure",
          title: isFilm ? "Production Shoot Call Sheet & Scene Slate" : "Historic Architectural Structure Portfolio",
          description: isFilm ? "Daily shooting call sheets, camera package slates, and scene breakdown schedules." : "Conservation preservation records, structural material diagnostics, and restoration plans.",
          density: "balanced",
        },
        secondaryFocus: {
          type: "chronological_timeline",
          entity: isFilm ? "SceneTimeline" : "RestorationMilestone",
          title: isFilm ? "Production Schedule & Principal Photography Timeline" : "Restoration Phases & Historical Milestone Timeline",
        },
        widgets: [
          { id: "w1", type: "schedule_gauge", title: isFilm ? "Principal Photography Progress" : "Conservation Milestone Realization", regionId: "hero" },
          { id: "w2", type: "resource_locker", title: isFilm ? "Camera & Lighting Inventory" : "Historic Blueprints & Diagnostics", regionId: "primary_detail" },
        ],
        interactions: [
          { trigger: "click", target: isFilm ? "+ Schedule Production Shoot" : "+ Register Conservation Project", action: "open_modal", description: "Opens intake modal" },
          { trigger: "select", target: "filter_status", action: "filter_feed", description: "Filters project activity feed" },
        ],
        responsiveStrategy: {
          desktop: "split-5-7",
          tablet: "stack-vertical-split",
          mobile: "single-column-flow",
        },
      };
    }

    // Default: ANALYZE_DISCOVER (Scientific Research, Laboratory, General Analytics)
    return {
      intent: "ANALYZE_DISCOVER",
      topology: {
        type: "OPERATIONAL_COMMAND_CONSOLE",
        regions: [
          { id: "hero", role: "hero", gridSpan: { cols: 12 }, density: "compact" },
          { id: "primary", role: "primary", gridSpan: { cols: 12 }, density: "compact" },
          { id: "secondary", role: "secondary", gridSpan: { cols: 12 }, density: "balanced" },
        ],
      },
      primaryFocus: {
        type: "telemetry_grid",
        entity: "TelemetryChannel",
        title: "Telemetry & Sensor Matrix",
        description: "Continuous real-time telemetry, calibrated thresholds, and automated anomaly detection.",
        density: "compact",
      },
      secondaryFocus: {
        type: "activity_stream",
        entity: "TelemetryEvent",
        title: "Real-time Event Stream & Audit Log",
      },
      widgets: [
        { id: "w1", type: "sensor_dial", title: "Primary Sensor Alignment", regionId: "hero" },
        { id: "w2", type: "telemetry_monitor", title: "Telemetry Channel", regionId: "primary" },
      ],
      interactions: [
        { trigger: "click", target: "+ New Telemetry Log", action: "open_modal", description: "Registers calibration record" },
        { trigger: "select", target: "filter_status", action: "filter_feed", description: "Filters active telemetry channel" },
      ],
      responsiveStrategy: {
        desktop: "command-console-3",
        tablet: "grid-2-col",
        mobile: "single-column-flow",
      },
    };
  }

  /**
   * Validates structural and semantic integrity of a CompositionGraph.
   */
  public static validate(graph: CompositionGraph): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!graph.topology || !graph.topology.type) {
      errors.push("CompositionGraph missing required topology type.");
    }
    if (!graph.topology.regions || graph.topology.regions.length === 0) {
      errors.push("CompositionGraph topology has no defined regions.");
    }
    if (!graph.primaryFocus || !graph.primaryFocus.type) {
      errors.push("CompositionGraph missing primaryFocus type definition.");
    }
    if (!graph.interactions || graph.interactions.length === 0) {
      errors.push("CompositionGraph missing interaction nodes.");
    }
    if (!graph.responsiveStrategy || !graph.responsiveStrategy.desktop || !graph.responsiveStrategy.mobile) {
      errors.push("CompositionGraph missing complete responsive breakpoint strategy.");
    }

    // Semantic validation: Actionable nodes must have targets
    for (const action of graph.interactions || []) {
      if (!action.target || !action.action) {
        errors.push(`Interaction node missing target or action type: ${JSON.stringify(action)}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
