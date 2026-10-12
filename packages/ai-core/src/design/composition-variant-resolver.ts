/**
 * CompositionVariantResolver
 *
 * Generates and selects structural composition variants dynamically derived
 * from product semantics, capability requirements, and generation seed.
 *
 * Invariant:
 * "A capability defines required behavior; composition defines spatial organization.
 * A capability MUST NOT prescribe its own page wireframe."
 */

import type { ExperienceCapabilityType } from "./experience-generators/generic-experience-generator.js";

export type DominantAxisType = "vertical" | "horizontal" | "radial" | "split" | "asymmetric";
export type FocalRegionType = "full_bleed" | "center_stage" | "left_rail" | "split_screen" | "top_hero" | "radial_hub";
export type PanelTopologyType = "none" | "overlay_drawer" | "docked_sidebar" | "floating_cards" | "bottom_tray" | "modal_dossier";
export type NavigationTopologyType = "top_floating_pills" | "docked_left_rail" | "horizontal_bottom_timeline" | "inline_chapter_tabs" | "orbital_controls" | "minimal_header";
export type ScrollModelType = "continuous_scroll" | "horizontal_pan" | "pinned_scene_replace" | "step_by_step" | "canvas_zoom_pan";
export type ContentToCanvasRatioType = "full_canvas" | "canvas_dominant" | "balanced_split" | "content_dominant";

export interface CompositionVariant {
  id: string;
  name: string;
  capability: ExperienceCapabilityType;
  dominantAxis: DominantAxisType;
  focalRegion: FocalRegionType;
  sectionTopology: string;
  panelTopology: PanelTopologyType;
  navigationTopology: NavigationTopologyType;
  scrollModel: ScrollModelType;
  contentToCanvasRatio: ContentToCanvasRatioType;
  structuralFingerprint: string;
  description: string;
  suitabilityScore?: number;
}

export interface CompositionResolverOptions {
  brandName: string;
  prompt: string;
  route: string;
  pageRole?: string;
  purpose?: string;
  experienceCapability: ExperienceCapabilityType | string;
  seed?: number;
  informationDensity?: "compact" | "balanced" | "expansive";
  emotionalTone?: string;
}

export class CompositionVariantResolver {
  private static hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Generates all valid candidate composition variants for a given capability.
   */
  public static getCandidateVariants(capability: ExperienceCapabilityType): CompositionVariant[] {
    switch (capability) {
      case "SCROLL_STORY":
        return [
          {
            id: "cinematic_full_bleed",
            name: "Cinematic Full-Bleed Story",
            capability: "SCROLL_STORY",
            dominantAxis: "vertical",
            focalRegion: "full_bleed",
            sectionTopology: "cinematic_full_bleed",
            panelTopology: "none",
            navigationTopology: "top_floating_pills",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "full_canvas",
            structuralFingerprint: "SCROLL_STORY:vertical:cinematic_full_bleed:top_floating_pills",
            description: "Full-bleed progressive narrative chapters with top floating progress indicators and centered typographic focus.",
          },
          {
            id: "horizontal_timeline",
            name: "Horizontal Story Timeline",
            capability: "SCROLL_STORY",
            dominantAxis: "horizontal",
            focalRegion: "center_stage",
            sectionTopology: "horizontal_timeline",
            panelTopology: "floating_cards",
            navigationTopology: "horizontal_bottom_timeline",
            scrollModel: "horizontal_pan",
            contentToCanvasRatio: "canvas_dominant",
            structuralFingerprint: "SCROLL_STORY:horizontal:horizontal_timeline:horizontal_bottom_timeline",
            description: "Horizontal timeline strip with lateral scene panning and bottom chapter milestone rail.",
          },
          {
            id: "split_editorial",
            name: "Split Editorial Narrative",
            capability: "SCROLL_STORY",
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "split_editorial",
            panelTopology: "overlay_drawer",
            navigationTopology: "inline_chapter_tabs",
            scrollModel: "pinned_scene_replace",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "SCROLL_STORY:split:split_editorial:inline_chapter_tabs",
            description: "Split-screen layout with pinned visual showcase card on one side and progressive text on the other.",
          },
          {
            id: "center_stage_pinned",
            name: "Center-Stage Pinned Scene",
            capability: "SCROLL_STORY",
            dominantAxis: "vertical",
            focalRegion: "center_stage",
            sectionTopology: "center_stage_pinned",
            panelTopology: "floating_cards",
            navigationTopology: "orbital_controls",
            scrollModel: "pinned_scene_replace",
            contentToCanvasRatio: "canvas_dominant",
            structuralFingerprint: "SCROLL_STORY:vertical:center_stage_pinned:orbital_controls",
            description: "Center-stage focal artifact with orbital chapter buttons and narrative transitions.",
          },
          {
            id: "docked_left_rail",
            name: "Docked Rail Chronicle",
            capability: "SCROLL_STORY",
            dominantAxis: "split",
            focalRegion: "left_rail",
            sectionTopology: "docked_left_rail",
            panelTopology: "docked_sidebar",
            navigationTopology: "docked_left_rail",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "SCROLL_STORY:split:docked_left_rail:docked_left_rail",
            description: "Fixed left index sidebar with progressive vertical scroll pane on the right.",
          },
        ];

      case "SPATIAL_MAP":
        return [
          {
            id: "map_first_drawer",
            name: "Full Viewport Map with Bottom Drawer",
            capability: "SPATIAL_MAP",
            dominantAxis: "radial",
            focalRegion: "full_bleed",
            sectionTopology: "map_first_drawer",
            panelTopology: "bottom_tray",
            navigationTopology: "minimal_header",
            scrollModel: "canvas_zoom_pan",
            contentToCanvasRatio: "full_canvas",
            structuralFingerprint: "SPATIAL_MAP:radial:map_first_drawer:bottom_tray",
            description: "Edge-to-edge interactive spatial canvas with slide-up bottom drawer for selected waypoint intelligence.",
          },
          {
            id: "radial_orbital",
            name: "Radial Orbital Radar",
            capability: "SPATIAL_MAP",
            dominantAxis: "radial",
            focalRegion: "radial_hub",
            sectionTopology: "radial_orbital",
            panelTopology: "modal_dossier",
            navigationTopology: "orbital_controls",
            scrollModel: "step_by_step",
            contentToCanvasRatio: "canvas_dominant",
            structuralFingerprint: "SPATIAL_MAP:radial:radial_orbital:modal_dossier",
            description: "Central radar hub with concentric orbital zones, sweep indicators, and corner waypoint dossier.",
          },
          {
            id: "vertical_expedition",
            name: "Vertical Expedition Trail",
            capability: "SPATIAL_MAP",
            dominantAxis: "vertical",
            focalRegion: "center_stage",
            sectionTopology: "vertical_expedition",
            panelTopology: "floating_cards",
            navigationTopology: "top_floating_pills",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "content_dominant",
            structuralFingerprint: "SPATIAL_MAP:vertical:vertical_expedition:floating_cards",
            description: "Top-to-bottom winding expedition map with alternating waypoint checkpoints and progress trail.",
          },
          {
            id: "split_dossier",
            name: "Split Topology with Sidebar Dossier",
            capability: "SPATIAL_MAP",
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "split_dossier",
            panelTopology: "docked_sidebar",
            navigationTopology: "minimal_header",
            scrollModel: "canvas_zoom_pan",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "SPATIAL_MAP:split:split_dossier:docked_sidebar",
            description: "Balanced dual-pane layout with topological constellation on left and permanent detail dossier on right.",
          },
        ];

      case "IMMERSIVE_3D":
        return [
          {
            id: "full_bleed_hero",
            name: "Full Bleed 3D World Stage",
            capability: "IMMERSIVE_3D",
            dominantAxis: "radial",
            focalRegion: "full_bleed",
            sectionTopology: "full_bleed_hero",
            panelTopology: "bottom_tray",
            navigationTopology: "minimal_header",
            scrollModel: "canvas_zoom_pan",
            contentToCanvasRatio: "full_canvas",
            structuralFingerprint: "IMMERSIVE_3D:radial:full_bleed_hero:bottom_tray",
            description: "Full viewport 3D world canvas with floating telemetry HUD and interactive raycast controls.",
          },
          {
            id: "workbench_dual_column",
            name: "Studio Configurator Workbench",
            capability: "IMMERSIVE_3D",
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "workbench_dual_column",
            panelTopology: "docked_sidebar",
            navigationTopology: "inline_chapter_tabs",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "IMMERSIVE_3D:split:workbench_dual_column:docked_sidebar",
            description: "Split layout with 3D turntable viewer on one side and material specifications/calibration on the other.",
          },
          {
            id: "gallery_showcase",
            name: "Center-Stage Pedestal Showcase",
            capability: "IMMERSIVE_3D",
            dominantAxis: "vertical",
            focalRegion: "center_stage",
            sectionTopology: "gallery_showcase",
            panelTopology: "floating_cards",
            navigationTopology: "orbital_controls",
            scrollModel: "pinned_scene_replace",
            contentToCanvasRatio: "canvas_dominant",
            structuralFingerprint: "IMMERSIVE_3D:vertical:gallery_showcase:floating_cards",
            description: "Focused product plinth with floating viewpoint controls and contextual detail chips.",
          },
          {
            id: "asymmetric_cards",
            name: "Asymmetric Editorial 3D Showcase",
            capability: "IMMERSIVE_3D",
            dominantAxis: "asymmetric",
            focalRegion: "top_hero",
            sectionTopology: "asymmetric_cards",
            panelTopology: "overlay_drawer",
            navigationTopology: "top_floating_pills",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "IMMERSIVE_3D:asymmetric:asymmetric_cards:top_floating_pills",
            description: "Asymmetric editorial showcase framing the 3D scene inside an architectural canvas alongside craftsmanship notes.",
          },
        ];

      case "COLLECTION_HUB":
        return [
          {
            id: "folder_collection_grid",
            name: "Collection Folder Grid",
            capability: "COLLECTION_HUB",
            dominantAxis: "vertical",
            focalRegion: "center_stage",
            sectionTopology: "folder_collection_grid",
            panelTopology: "floating_cards",
            navigationTopology: "top_floating_pills",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "content_dominant",
            structuralFingerprint: "COLLECTION_HUB:vertical:folder_collection_grid:top_floating_pills",
            description: "Curated collection folders with bookmark card grid and modal field notes.",
          },
          {
            id: "split_collection_dossier",
            name: "Split Collection Dossier",
            capability: "COLLECTION_HUB",
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "split_collection_dossier",
            panelTopology: "docked_sidebar",
            navigationTopology: "docked_left_rail",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "COLLECTION_HUB:split:split_collection_dossier:docked_left_rail",
            description: "Split-pane collection view with left folder directory and right discovery details.",
          },
        ];

      case "ITINERARY_PLANNER":
        return [
          {
            id: "chronological_day_timeline",
            name: "Chronological Day Timeline",
            capability: "ITINERARY_PLANNER",
            dominantAxis: "vertical",
            focalRegion: "top_hero",
            sectionTopology: "day_timeline_strip",
            panelTopology: "overlay_drawer",
            navigationTopology: "horizontal_bottom_timeline",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "content_dominant",
            structuralFingerprint: "ITINERARY_PLANNER:vertical:day_timeline_strip:horizontal_bottom_timeline",
            description: "Multi-day chronological itinerary timeline with scheduled stops and drawer stop editor.",
          },
          {
            id: "split_schedule_navigator",
            name: "Split Schedule Navigator",
            capability: "ITINERARY_PLANNER",
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "split_schedule_navigator",
            panelTopology: "docked_sidebar",
            navigationTopology: "inline_chapter_tabs",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: "ITINERARY_PLANNER:split:split_schedule_navigator:inline_chapter_tabs",
            description: "Split itinerary builder with daily schedule timeline on left and culinary stop detail inspector on right.",
          },
        ];

      default:
        return [
          {
            id: "balanced_dual_pane",
            name: "Standard Balanced Workspace",
            capability,
            dominantAxis: "split",
            focalRegion: "split_screen",
            sectionTopology: "workbench_dual_column",
            panelTopology: "docked_sidebar",
            navigationTopology: "minimal_header",
            scrollModel: "continuous_scroll",
            contentToCanvasRatio: "balanced_split",
            structuralFingerprint: `${capability}:split:workbench_dual_column:docked_sidebar`,
            description: "Standard dual-column workspace layout.",
          },
        ];
    }
  }

  /**
   * Resolves the single best composition variant based on semantics, route, and seed.
   */
  public static resolve(options: CompositionResolverOptions): CompositionVariant {
    const {
      brandName,
      prompt,
      route,
      pageRole = "",
      purpose = "",
      experienceCapability,
      seed = 42,
    } = options;

    const capability = experienceCapability as ExperienceCapabilityType;
    const candidates = this.getCandidateVariants(capability);

    if (candidates.length === 1) {
      return candidates[0];
    }

    // Incorporate route and purpose into effective seed to ensure distinct routes in the same project diverge
    const routeSemanticHash = this.hash(`${route}:${pageRole}:${purpose}:${prompt.slice(0, 30)}`);
    const effectiveSeed = (seed ^ routeSemanticHash) >>> 0;

    // Score candidates against semantic hints
    const combined = `${prompt} ${route} ${pageRole} ${purpose}`.toLowerCase();
    const scored = candidates.map(c => {
      let score = 10;

      // SCROLL_STORY semantic heuristics
      if (capability === "SCROLL_STORY") {
        if (c.id === "horizontal_timeline" && /(timeline|chronological|years|milestones|progression)/i.test(combined)) score += 15;
        if (c.id === "cinematic_full_bleed" && /(cinematic|immersive|visual|film|atmosphere|grand)/i.test(combined)) score += 15;
        if (c.id === "split_editorial" && /(editorial|craft|materials|joinery|essay|article|journal)/i.test(combined)) score += 15;
        if (c.id === "center_stage_pinned" && /(artifact|hero|showcase|focal|spotlight)/i.test(combined)) score += 15;
        if (c.id === "docked_left_rail" && /(index|chapter-list|guide|manual|documentation)/i.test(combined)) score += 15;
      }

      // SPATIAL_MAP semantic heuristics
      if (capability === "SPATIAL_MAP") {
        if (c.id === "vertical_expedition" && /(trail|path|expedition|ascent|descent|vertical|climb|route)/i.test(combined)) score += 15;
        if (c.id === "radial_orbital" && /(radar|orbital|concentric|sonar|echo|frequency|constellation)/i.test(combined)) score += 15;
        if (c.id === "map_first_drawer" && /(atlas|interactive|explore|full-screen|ocean|marine)/i.test(combined)) score += 15;
        if (c.id === "split_dossier" && /(dossier|landmarks|coordinates|quest|waypoint|records)/i.test(combined)) score += 15;
      }

      // IMMERSIVE_3D semantic heuristics
      if (capability === "IMMERSIVE_3D") {
        if (c.id === "workbench_dual_column" && /(configurator|workbench|tuning|materials|specs|woodcraft|furniture)/i.test(combined)) score += 15;
        if (c.id === "full_bleed_hero" && /(world|realm|explore|landscape|environment|walkthrough)/i.test(combined)) score += 15;
        if (c.id === "gallery_showcase" && /(pedestal|plinth|sculpture|timepiece|watch|single-product)/i.test(combined)) score += 15;
        if (c.id === "asymmetric_cards" && /(editorial|bespoke|story|boutique|architectural)/i.test(combined)) score += 15;
      }

      return { ...c, suitabilityScore: score };
    });

    // Sort by score, then pick deterministically using seed
    scored.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));

    // Choose among the top candidates using modulo of effective seed
    // High-scoring candidates within 20 points are eligible, with at least top 2-3 available for seed variation
    const topScore = scored[0].suitabilityScore || 0;
    const eligible = scored.filter(s => (s.suitabilityScore || 0) >= topScore - 20);
    const pool = eligible.length >= 2 ? eligible : scored.slice(0, Math.min(3, scored.length));
    const chosenIndex = effectiveSeed % pool.length;

    return pool[chosenIndex];
  }
}
