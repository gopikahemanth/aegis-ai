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

export type FocusDensity = "compact" | "balanced" | "spacious";

export type PrimaryFocusType =
  | "availability_matrix"
  | "master_detail"
  | "live_stage_matrix"
  | "telemetry_grid"
  | "kanban_board"
  | "timeline_pipeline"
  | "document_workspace"
  | "catalog_grid";

export type SecondaryFocusType =
  | "arrival_queue"
  | "chronological_timeline"
  | "dispatch_board"
  | "activity_stream"
  | "status_pipeline"
  | "financial_summary";

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

export interface CompositionGraph {
  topology: {
    type: LayoutTopologyType;
    regions: RegionNode[];
  };
  primaryFocus: {
    type: PrimaryFocusType;
    title: string;
    description: string;
    density: FocusDensity;
  };
  secondaryFocus: {
    type: SecondaryFocusType;
    title: string;
  };
  widgets: WidgetNode[];
  interactions: InteractionNode[];
}

export class CompositionGraphSynthesizer {
  /**
   * Synthesizes a structured CompositionGraph from domain understanding and UX intent.
   */
  public static synthesize(
    prompt: string,
    domain: string,
    layoutFamily: string
  ): CompositionGraph {
    const text = `${prompt} ${domain} ${layoutFamily}`.toLowerCase();

    // 1. Hospitality / Travel / Resort / Charter
    if (text.includes("resort") || text.includes("hotel") || text.includes("hospitality") || text.includes("yacht") || text.includes("charter")) {
      return {
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
          title: "Suite & Inventory Availability Matrix",
          description: "Real-time tier capacity, reservation slots, and immediate booking engine.",
          density: "spacious",
        },
        secondaryFocus: {
          type: "arrival_queue",
          title: "VIP Arrivals & Concierge Queue",
        },
        widgets: [
          { id: "w1", type: "occupancy_gauge", title: "Occupancy Index", regionId: "hero" },
          { id: "w2", type: "venue_utilization", title: "Amenity Utilization", regionId: "secondary" },
        ],
        interactions: [
          { trigger: "click", target: "+ Reserve Luxury Suite", action: "open_modal", description: "Opens instant reservation flow" },
          { trigger: "select", target: "filter_status", action: "filter_feed", description: "Filters guest activity stream" },
        ],
      };
    }

    // 2. Legal / Professional / Compliance / Dossier
    if (text.includes("legal") || text.includes("chambers") || text.includes("law") || text.includes("court") || text.includes("litigation")) {
      return {
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
          title: "Active Litigation Docket & Case Briefs",
          description: "Split-view matter index with instant brief inspection and counsel assignment.",
          density: "compact",
        },
        secondaryFocus: {
          type: "chronological_timeline",
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
      };
    }

    // 3. Festival / Music / Stage / Real-time Live Ops
    if (text.includes("festival") || text.includes("stage") || text.includes("music") || text.includes("concert") || text.includes("production")) {
      return {
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
          title: "Live Stage Production Matrix",
          description: "Real-time acoustic decibel monitoring, artist countdowns, and stage capacity.",
          density: "compact",
        },
        secondaryFocus: {
          type: "dispatch_board",
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
      };
    }

    // 4. Laboratory / Scientific / Telemetry / Mission Control
    return {
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
        title: "Telemetry & Sensor Matrix",
        description: "Continuous real-time telemetry, calibrated thresholds, and automated anomaly detection.",
        density: "compact",
      },
      secondaryFocus: {
        type: "activity_stream",
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
    };
  }
}
