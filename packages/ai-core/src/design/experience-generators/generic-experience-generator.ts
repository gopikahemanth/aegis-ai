/**
 * GenericExperienceGenerator
 *
 * Unified architecture for generic experience-capability generation.
 * Maps route purpose, feature, and required capability into pure parametric generators:
 * - SpatialMapExperienceGenerator (SPATIAL_MAP)
 * - ScrollStoryExperienceGenerator (SCROLL_STORY)
 * - AudioExperienceGenerator (AUDIO_SYNTH)
 * - CharacterExperienceGenerator (CHARACTER_STAGE)
 * - Product3DExperienceGenerator (IMMERSIVE_3D)
 * - WorkspaceExperienceGenerator (WORKSPACE_TOOL)
 *
 * Architecture:
 * Product/Page Semantics -> Experience Capability -> CompositionVariantResolver -> Page Generator
 * Completely domain-agnostic: zero hardcoded domain or brand templates.
 */

import { SpatialMapExperienceGenerator, SpatialMapGeneratorOptions } from "./spatial-map-generator.js";
import { ScrollStoryExperienceGenerator, ScrollStoryGeneratorOptions } from "./scroll-story-generator.js";
import { AudioExperienceGenerator, AudioExperienceGeneratorOptions } from "./audio-experience-generator.js";
import { CharacterExperienceGenerator, CharacterExperienceGeneratorOptions } from "./character-experience-generator.js";
import { Product3DExperienceGenerator, Product3DGeneratorOptions } from "./product-3d-generator.js";
import { WorkspaceExperienceGenerator, WorkspaceExperienceGeneratorOptions } from "./workspace-experience-generator.js";
import { CollectionHubExperienceGenerator, CollectionHubGeneratorOptions } from "./collection-hub-generator.js";
import { ItineraryPlannerExperienceGenerator, ItineraryPlannerGeneratorOptions } from "./itinerary-planner-generator.js";
import { StorefrontCatalogExperienceGenerator, StorefrontCatalogGeneratorOptions } from "./storefront-catalog-generator.js";
import { CompositionVariantResolver, CompositionVariant } from "../composition-variant-resolver.js";

export type ExperienceCapabilityType =
  | "SPATIAL_MAP"
  | "SCROLL_STORY"
  | "AUDIO_SYNTH"
  | "CHARACTER_STAGE"
  | "IMMERSIVE_3D"
  | "WORKSPACE_TOOL"
  | "COLLECTION_HUB"
  | "ITINERARY_PLANNER"
  | "STOREFRONT_CATALOG";

export interface GenericExperienceOptions {
  componentName: string;
  brandName: string;
  route: string;
  pageRole?: string;
  purpose?: string;
  prompt: string;
  seed?: number;
  experienceCapability?: ExperienceCapabilityType | string;
  composition?: CompositionVariant;
  domainKeywords?: string[];
  primaryMetrics?: string[];
  actionVerbs?: string[];
  routeIndex?: number;
  theme?: {
    bg?: string;
    surface?: string;
    border?: string;
    accent?: string;
    text?: string;
    textMuted?: string;
  };
}

export class GenericExperienceGenerator {
  /**
   * Determine the best experience capability based on route, role, purpose, and capability hints.
   */
  public static resolveCapability(options: {
    route: string;
    pageRole?: string;
    purpose?: string;
    experienceCapability?: string;
    prompt?: string;
  }): ExperienceCapabilityType {
    const { route, pageRole = "", purpose = "", experienceCapability = "" } = options;
    const combined = `${route} ${pageRole} ${purpose} ${experienceCapability}`.toLowerCase();

    // 0. Storefront, Catalog & Service Offerings match
    const isCatalogOrOfferingsPrompt = Boolean(
      options.prompt &&
      /bookstore|bookseller|book\s*shop|page & petal|storefront|retail|shop|market|store|boutique|merch|apparel|clothing|bakery|bakes|pastry|cafe|coffee|carwash|wash|auto|detailing|fleet|clinic|wellness|medical|dental|salon|spa|studio|offerings|packages|services/i.test(options.prompt)
    );
    if (
      /storefront_catalog|storefront-catalog|book-catalog|product-catalog|curated-catalog|shop-grid|bookstore-catalog|service-catalog|packages-catalog|offerings-grid/i.test(combined) ||
      (isCatalogOrOfferingsPrompt && (/catalog|book|shop|store|product|item|service|package|menu|bake|treatment|showcase|edition|vault|home|reading|salon|volume|author|order/i.test(combined) || route === "/" || !combined.trim())) ||
      (!/sky-object|astronom/i.test(combined) && (/catalog/i.test(route) || /catalog/i.test(pageRole) || /services/i.test(route) || /packages/i.test(route) || /menu/i.test(route)))
    ) {
      return "STOREFRONT_CATALOG";
    }

    // 1. Explicit capability match
    if (/collection_hub|collection-folder|discovery-bookmark|saved-discover|bookmark-hub|curated-collection|saved-items/i.test(combined)) return "COLLECTION_HUB";
    if (/itinerary_planner|itinerary-builder|day-schedule|itinerary-planner|trip-planner|journey-planner|culinary-itinerary/i.test(combined)) return "ITINERARY_PLANNER";
    if (/spatial_map|spatial-map|map-canvas|interactive-map|cartograph|bathymetry|floor-plan|floorplan/i.test(combined)) return "SPATIAL_MAP";
    if (/scroll_story|scroll-story|scroll-driven|scrollytelling|scroll-chapter|narrative-chapter|discovery-ledger/i.test(combined)) return "SCROLL_STORY";
    if (/audio_synth|audio_interaction|web-audio|audio-visualizer|soundboard|synth|audio-guide|audioguide/i.test(combined)) return "AUDIO_SYNTH";
    if (/character_stage|entity_showcase|companion|avatar-stage|3d-avatar|specimen/i.test(combined)) return "CHARACTER_STAGE";
    if (/immersive_3d|product_3d|webgl-canvas|3d-webgl|3d-model|3d-viewer|turntable/i.test(combined)) return "IMMERSIVE_3D";
    if (/workspace_tool|workspace|workbench|telemetry|configurator|tuning|console/i.test(combined)) return "WORKSPACE_TOOL";

    // 2. Route & Purpose semantic match
    if (/(saved|bookmarks?|favorites?|collections?|saved-discoveries|saved-artworks|roster|inventory|archive|reports?|compliance|matrix|ledger)/i.test(combined)) {
      return "COLLECTION_HUB";
    }
    if (/(itinerary|itineraries|planner|journey-builder|trip-planner|schedule-builder|visit-plan|work-orders?|technician-dispatch|shift-schedule|preventive-schedule)/i.test(combined)) {
      return "ITINERARY_PLANNER";
    }
    if (/(quest|map|zones|waypoints|dive-sites|coordinates|biomes|atlas|trails|cartography|floor-plan|floorplan)/i.test(combined)) {
      return "SPATIAL_MAP";
    }
    if (/(story|stories|narrative|journey|lore|history|adventures|origins|mission|chronicle|essay|scroll)/i.test(combined)) {
      return "SCROLL_STORY";
    }
    if (/(sound|audio|whimsical-sounds|frequencies|music|synth|tunes|acoustic|ambient-audio|sonic)/i.test(combined)) {
      return "AUDIO_SYNTH";
    }
    if (/(characters|companions|roster|entities|species|specimens|cast|creatures|avatars|crew)/i.test(combined)) {
      return "CHARACTER_STAGE";
    }
    if (/(3d|exhibit|sculpture|materials|furniture-config|model-viewer|turntable)/i.test(combined)) {
      return "IMMERSIVE_3D";
    }
    if (/(tool|config|lab|workbench|workspace|dashboard|telemetry|analytics|control|studio|settings|matrix)/i.test(combined)) {
      return "WORKSPACE_TOOL";
    }

    return "WORKSPACE_TOOL";
  }

  /**
   * Generate code for the resolved experience capability using the resolved composition.
   */
  public static generate(options: GenericExperienceOptions): string {
    const capability = options.experienceCapability
      ? (options.experienceCapability as ExperienceCapabilityType)
      : this.resolveCapability(options);

    // Resolve generative composition variant if not explicitly provided
    const composition =
      options.composition ||
      CompositionVariantResolver.resolve({
        brandName: options.brandName,
        prompt: options.prompt,
        route: options.route,
        pageRole: options.pageRole,
        purpose: options.purpose,
        experienceCapability: capability,
        seed: options.seed,
      });

    const enrichedOptions = {
      ...options,
      experienceCapability: capability,
      composition,
    };

    switch (capability) {
      case "COLLECTION_HUB":
        return CollectionHubExperienceGenerator.generate(enrichedOptions as CollectionHubGeneratorOptions);

      case "ITINERARY_PLANNER":
        return ItineraryPlannerExperienceGenerator.generate(enrichedOptions as ItineraryPlannerGeneratorOptions);

      case "SPATIAL_MAP":
        return SpatialMapExperienceGenerator.generate(enrichedOptions as SpatialMapGeneratorOptions);

      case "SCROLL_STORY":
        return ScrollStoryExperienceGenerator.generate(enrichedOptions as ScrollStoryGeneratorOptions);

      case "AUDIO_SYNTH":
        return AudioExperienceGenerator.generate(enrichedOptions as AudioExperienceGeneratorOptions);

      case "CHARACTER_STAGE":
        return CharacterExperienceGenerator.generate(enrichedOptions as CharacterExperienceGeneratorOptions);

      case "IMMERSIVE_3D":
        return Product3DExperienceGenerator.generate(enrichedOptions as Product3DGeneratorOptions);

      case "STOREFRONT_CATALOG":
        return StorefrontCatalogExperienceGenerator.generate(enrichedOptions as StorefrontCatalogGeneratorOptions);

      case "WORKSPACE_TOOL":
      default:
        return WorkspaceExperienceGenerator.generate(enrichedOptions as WorkspaceExperienceGeneratorOptions);
    }
  }
}
