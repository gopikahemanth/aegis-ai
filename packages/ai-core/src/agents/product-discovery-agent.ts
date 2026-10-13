/**
 * ProductDiscoveryAgent
 *
 * Discovers real-world domain requirements, core user flows, standard operational features,
 * run-to-run differentiator features, and data models before planning or coding.
 *
 * Replaces naive keyword guessing with domain-expert product discovery.
 * Includes non-blocking fallback if LLM is unreachable or returns malformed JSON.
 */

import { BaseAgent } from "./base-agent.js";
import type { ProductCharacteristics } from "../design/product-understanding.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import { createHash } from "node:crypto";

export interface FeatureSpec {
  name: string;
  description: string;
  requiredComponents: string[];
  requiredDataFields?: string[];
}

export interface DataModelSpec {
  name: string;
  fields: string[];
  relations?: string[];
}

export interface FeatureMatrix {
  category: string;
  /**
   * ADVISORY ONLY — not consumed by the design pipeline downstream.
   *
   * CapabilityPlanner.fromFeatureMatrix() and CapabilityPlanner.plan() both read
   * `characteristics.experiencePattern` (from ProductUnderstanding.analyze()), NOT this field.
   * This value is returned by the LLM and by deterministic fallbacks as context/debugging aid,
   * but has zero effect on which PAGE_TEMPLATE, CompositionFamily, or hero element is selected.
   *
   * The sole source of truth for experience pattern throughout the design pipeline is:
   *   ProductUnderstanding.analyze(prompt).experiencePattern
   */
  experiencePattern?: ProductCharacteristics["experiencePattern"];
  /** Authoritative primary landing feature designated for root "/" landing experience */
  primaryLandingFeature?: string;
  corePages: string[];
  standardFeatures: FeatureSpec[];
  differentiatorFeatures: FeatureSpec[]; // 2-3 features unique to THIS generation run
  dataModels: DataModelSpec[];
  isFallback?: boolean;
}


export class ProductDiscoveryAgent extends BaseAgent {
  readonly name = "Product Discovery Agent";
  private readonly jsonExtractor = new JsonExtractor();

  /**
   * Executes domain discovery using the LLM with safe fallback.
   */
  async discover(
    prompt: string,
    characteristics: ProductCharacteristics,
    seedOverride?: string
  ): Promise<FeatureMatrix> {
    const runSeed = seedOverride || createHash("sha256").update(`${prompt}_${Date.now()}`).digest("hex").slice(0, 8);

    try {
      const discoveryPrompt = this.buildPrompt(prompt, characteristics, runSeed);
      const response = await this.provider.chat([
        {
          role: "system",
          content: `You are a Principal Product Architect and Industry Domain Expert.
Your job is to analyze business requests and define what a real-world, production business in that category actually requires to operate successfully.
Reason from first principles about customer journeys, operational workflows, and domain realities.
NEVER provide generic filler. Provide concrete, domain-specific features and entities.
Return ONLY a valid, parseable JSON object matching the requested schema. No markdown backticks, no commentary.`
        },
        {
          role: "user",
          content: discoveryPrompt
        }
      ], {
        temperature: 0.4,
        maxTokens: 8192,
        agentType: "discovery",
        complexity: 8,
      } as any);

      const extractedJson = this.jsonExtractor.extract(response);
      const parsed = JSON.parse(extractedJson) as FeatureMatrix;

      if (this.isValidFeatureMatrix(parsed)) {
        parsed.isFallback = false;
        console.log(`[ProductDiscovery] ✓ Discovered category "${parsed.category}" with ${parsed.standardFeatures.length} standard & ${parsed.differentiatorFeatures.length} differentiator features.`);
        return parsed;
      }

      console.warn("[ProductDiscovery] ⚠️ Discovery output failed schema validation. Falling back to deterministic domain matrix.");
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    } catch (err: any) {
      console.warn(`[ProductDiscovery] ⚠️ Discovery agent failed: ${err.message}. Using non-blocking domain fallback.`);
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    }
  }

  private buildPrompt(prompt: string, characteristics: ProductCharacteristics, runSeed: string): string {
    return `
BUSINESS INITIATIVE / PROMPT: "${prompt}"

PRODUCT CONTEXT (from ProductUnderstanding):
- Experience Pattern: ${characteristics.experiencePattern}
- Primary Activity: ${characteristics.primaryActivity}
- Emotional Tone: ${characteristics.emotionalTone.primary}
- Audience: ${characteristics.targetAudience || "General customers"}
- Run Seed: ${runSeed}

TASK:
Produce a comprehensive, domain-accurate FeatureMatrix for this product.
Do not simply echo the user's words. Reason as an industry expert: what does a business of this type actually require to serve customers and operate?

REQUIREMENTS:
1. "category": Concise industry label (e.g. "Luxury Hospitality & Resort", "Automotive Detailing & Wash", "SaaS Engineering Project Management", "Artisan Bakery & Confectionery", "Consumer E-Commerce & Retail Marketplace").
2. "experiencePattern": Select the single most accurate UX macro-pattern for this domain:
   - "storefront-commerce": Retail shopping, marketplaces, e-commerce, consumer store with promotional banners, product catalog grid, and shopping cart
   - "hospitality-portal": Luxury resorts, hotels, vacation stays, retreats, villas with immersive booking bar
   - "catalog-browser": Curated discovery listings, libraries, galleries
   - "booking-flow": Appointment scheduling, service bookings, reservations
   - "operations-dashboard": Operational monitoring, KPIs, business analytics, internal management
   - "workspace-editor": Document, media, or creative authoring canvas
   - "personal-tracker": Personal habit, wellness, mood, or longitudinal health tracking
   - "configurator-workspace": Engineering/industrial design, photometrics, physical parameter configurator
3. "primaryLandingFeature": The name of the single core feature or page that serves as the primary home landing experience ("/") for end users (e.g. for a school/edtech: "Course Catalog", for freight logistics: "Dispatch Log", for bakery: "Daily Fresh Bread Menu", for portfolio: "Project Showcase"). It must be an active, primary user workflow, NEVER an administrative, utility, export, or secondary page.
4. "corePages": 3-6 route names with leading slash (e.g. ["/", "/deals", "/categories", "/cart"]).
5. "standardFeatures": 4-6 essential operational features (e.g. for car wash: package comparison, vehicle size selector, appointment scheduler, add-on selector, location & bay tracker).
6. "differentiatorFeatures": Exactly 2-3 innovative or unique features that set THIS specific product apart from competitors (incorporate seed: ${runSeed} for variety). E.g. For a resort: "Sommelier Cellar Booking", "Sunset Yacht Concierge"; for a bakery: "Weekly Sourdough Subscription", "Custom Cake 3D Builder".
7. "dataModels": 3-5 core business entities with realistic domain fields and relations.

SCHEMA SPECIFICATION (JSON ONLY):
{
  "category": string,
  "experiencePattern": "storefront-commerce" | "hospitality-portal" | "catalog-browser" | "booking-flow" | "operations-dashboard" | "workspace-editor" | "personal-tracker" | "configurator-workspace",
  "primaryLandingFeature": string,
  "corePages": string[],
  "standardFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "differentiatorFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": string[],
      "relations": string[]
    }
  ]
}
`.trim();
  }

  private isValidFeatureMatrix(data: any): data is FeatureMatrix {
    if (
      typeof data === "object" &&
      data !== null &&
      typeof data.category === "string" &&
      Array.isArray(data.corePages) &&
      data.corePages.length >= 2 &&
      Array.isArray(data.standardFeatures) &&
      data.standardFeatures.length >= 2 &&
      Array.isArray(data.differentiatorFeatures) &&
      data.differentiatorFeatures.length >= 1 &&
      Array.isArray(data.dataModels) &&
      data.dataModels.length >= 1
    ) {
      if (!data.primaryLandingFeature || typeof data.primaryLandingFeature !== "string") {
        data.primaryLandingFeature = data.standardFeatures[0]?.name || "Home";
      }
      return true;
    }
    return false;
  }

  /**
   * Deterministically select differentiator features from a category pool using the seed hash.
   * Guarantees 2-3 distinct features per run and variation across different seeds.
   */
  private selectDifferentiators(pool: FeatureSpec[], seed: string | number, count: number = 2): FeatureSpec[] {
    const hashHex = createHash("sha256").update(String(seed ?? "default_seed")).digest("hex");
    const val1 = parseInt(hashHex.slice(0, 4), 16);
    const val2 = parseInt(hashHex.slice(4, 8), 16);
    const val3 = parseInt(hashHex.slice(8, 12), 16);

    const available = [...pool];
    const result: FeatureSpec[] = [];
    const vals = [val1, val2, val3];
    const takeCount = Math.min(count, available.length);

    for (let i = 0; i < takeCount; i++) {
      const idx = vals[i] % available.length;
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  }

  /**
   * Deterministic domain fallback ensuring the pipeline never blocks if the LLM call fails.
   */
  public fallback(prompt: string, characteristics: ProductCharacteristics, seed: string | number): FeatureMatrix {
    const p = prompt.toLowerCase();
    const s = String(seed ?? prompt);

    // 0a. Whimsical 3D Fantasy Adventure Universe (Kazzoo)
    if (/\b(kazzoo|claymation|fantasy adventure|world explorer|quest map|soundboard|family adventure)\b/i.test(p)) {
      const fantasyDifferentiators: FeatureSpec[] = [
        {
          name: "Whimsical 3D World Explorer Stage",
          description: "Tactile Three.js WebGL terrain with mossy hills, pastel spheres, and interactive companion raycasting.",
          requiredComponents: ["WorldStage", "BiomeDock", "LandmarkTracker"],
          requiredDataFields: ["biomeName", "landmarkCount", "activeAvatar"],
        },
        {
          name: "Interactive Magical Soundboard",
          description: "Tactile sound pads triggering fantasy chime frequencies, creature greetings, and spell audio.",
          requiredComponents: ["SoundboardPadGrid", "AudioWaveform", "VolumeToggle"],
          requiredDataFields: ["soundTitle", "frequencyHz", "audioCategory"],
        },
        {
          name: "Generative Journey Narrative Scroll",
          description: "Synchronized family journey scroll documenting discovered landmarks and solved puzzles.",
          requiredComponents: ["JourneyScrollUnfold", "MilestoneBadge", "ParchmentExporter"],
          requiredDataFields: ["chapterTitle", "unlockedSecret", "completionDate"],
        },
      ];

      return {
        category: "Whimsical 3D Fantasy Universe",
        experiencePattern: "immersive-3d",
        primaryLandingFeature: "World Explorer",
        corePages: ["/", "/characters", "/quest-map", "/soundboard", "/journey-scroll"],
        standardFeatures: [
          {
            name: "World Explorer",
            description: "Full-bleed interactive 3D WebGL realm with procedural mossy hills and clickable landmarks.",
            requiredComponents: ["WorldStage", "RealmTelemetryDock", "SphereRaycaster"],
            requiredDataFields: ["realmName", "discoveredLandmarks", "companionAvatar"],
          },
          {
            name: "Interactive Quest Map",
            description: "Dynamic fantasy quest ledger with milestone progress and confetti unlocks.",
            requiredComponents: ["QuestNodeMap", "ProgressTrack", "RewardModal"],
            requiredDataFields: ["questTitle", "difficulty", "rewardBadge", "isComplete"],
          },
          {
            name: "Character Bio Cards & Voice Clips",
            description: "Claymation companion bio cards with audio voice clip simulators and lore traits.",
            requiredComponents: ["CharacterCard", "VoiceClipPlayer", "CompanionStats"],
            requiredDataFields: ["name", "species", "realmOrigin", "voiceClipUrl", "loreSnippet"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(fantasyDifferentiators, s, 2),
        dataModels: [
          { name: "WorldLocation", fields: ["id", "name", "region", "coordinates", "status"] },
          { name: "Quest", fields: ["id", "title", "description", "progress", "reward", "isCompleted"] },
          { name: "Character", fields: ["id", "name", "species", "realm", "voiceClip", "ability"] },
          { name: "SoundItem", fields: ["id", "title", "category", "durationSeconds", "hotkey"] },
          { name: "ScrollChapter", fields: ["id", "chapterNumber", "title", "storyContent", "isUnlocked"] },
        ],
      };
    }

    // 0b. Luxury Artisan Watch Studio / Horology Atelier
    if (/\b(watch|watches|horology|timepiece|timepieces|watchmaker|artisan watch)\b/i.test(p)) {
      const watchDifferentiators: FeatureSpec[] = [
        {
          name: "Interactive 3D Complication Loupe",
          description: "360-degree high-precision movement rotator with exploded tourbillon view and escapement animation.",
          requiredComponents: ["CaliberLoupeViewer", "MaterialSelector", "ExplodedViewToggle"],
          requiredDataFields: ["caliberReference", "jewelCount", "vibrationsPerHour"],
        },
        {
          name: "Metiers d'Art Finishing Chronicles",
          description: "Tactile documentation of black polish, anglage, and grand feu vitrified enamel dials.",
          requiredComponents: ["FinishingGallery", "CraftsmanshipInspector"],
          requiredDataFields: ["techniqueName", "artisanHours", "materialGrade"],
        },
      ];

      return {
        category: "Luxury Artisan Horology Studio",
        experiencePattern: "immersive-3d",
        primaryLandingFeature: "Product Showcase & Timepiece Configurator",
        corePages: ["/", "/craftsmanship", "/calibers", "/atelier", "/viewing"],
        standardFeatures: [
          {
            name: "Product Showcase & Timepiece Configurator",
            description: "Rotatable 3D timepiece display with titanium, rose gold, and platinum material toggles.",
            requiredComponents: ["WatchStage", "MaterialPalette", "SpecificationDrawer"],
            requiredDataFields: ["modelName", "caseMaterial", "diameterMm", "powerReserveHours", "price"],
          },
          {
            name: "Private Viewing Atelier Concierge",
            description: "Private salon appointment request with concierge date selection in Geneva.",
            requiredComponents: ["ViewingScheduler", "SalonSelector", "ConfirmationNotice"],
            requiredDataFields: ["clientName", "requestedTimepiece", "appointmentDate", "salonLocation"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(watchDifferentiators, s, 2),
        dataModels: [
          { name: "Timepiece", fields: ["id", "name", "reference", "caseMaterial", "diameter", "price", "powerReserve"] },
          { name: "Caliber", fields: ["id", "caliberNumber", "complications", "finishingDetails", "jewels"] },
          { name: "ViewingRequest", fields: ["id", "clientName", "email", "timepieceId", "preferredDate", "status"] },
        ],
      };
    }

    // 0b2. Contemporary Art Museum / Curated Gallery Collection
    if (/\b(museum|art museum|contemporary art|gallery|curatorial|exhibitions|artworks|artwork collection)\b/i.test(p)) {
      const museumDifferentiators: FeatureSpec[] = [
        {
          name: "Curatorial Audio Guide & Commentary",
          description: "Curator voices, artist interviews, and immersive commentary walkthroughs for exhibitions.",
          requiredComponents: ["AudioGuidePlayer", "CuratorNotesDrawer", "TrackTimeline"],
          requiredDataFields: ["trackTitle", "narrator", "durationSeconds", "roomLocation", "curatorialNotes"],
        },
        {
          name: "Interactive Spatial Floor Plan",
          description: "Multi-level museum wing exploration, exhibition zones, and artwork waypoints.",
          requiredComponents: ["FloorPlanViewer", "WingSelector", "ArtworkWaypointMarker"],
          requiredDataFields: ["wingName", "floorLevel", "currentExhibition", "galleries"],
        },
      ];

      return {
        category: "Contemporary Art Museum",
        experiencePattern: "craft-editorial",
        primaryLandingFeature: "Rotating Exhibitions & Collection Showcase",
        corePages: [
          "/",
          "/rotating-exhibitions",
          "/explore-artist-profiles",
          "/search-semantic-artworks",
          "/navigate-interactive-floor-plan",
          "/listen-to-audio-guide",
          "/plan-museum-visit",
          "/saved-artworks",
        ],
        standardFeatures: [
          {
            name: "Rotating Exhibitions",
            description: "Curated contemporary exhibitions with gallery imagery, curatorial essays, and dates.",
            requiredComponents: ["ExhibitionHero", "CuratorialEssay", "ArtistRoster"],
            requiredDataFields: ["title", "curator", "startDate", "endDate", "galleryWing"],
          },
          {
            name: "Searchable Artwork Collection",
            description: "Deep collection exploration with medium, period, artist, and semantic search.",
            requiredComponents: ["ArtworkGrid", "MediumFilter", "CuratorialDetailModal"],
            requiredDataFields: ["title", "artist", "year", "medium", "dimensions", "galleryLocation"],
          },
          {
            name: "Artist Profiles & Monograph Folios",
            description: "Comprehensive artist biographies, monographs, and featured works.",
            requiredComponents: ["ArtistProfileHero", "ArtworkFolio", "CuratorialBio"],
            requiredDataFields: ["name", "nationality", "movement", "biography", "notableWorks"],
          },
          {
            name: "Museum Visit Planner & Hours",
            description: "Ticketing tiers, gallery hours, admissions, and personal itinerary planning.",
            requiredComponents: ["VisitPlanner", "HoursCalendar", "AdmissionTierSelector"],
            requiredDataFields: ["visitDate", "entrySlot", "selectedWings", "attendees"],
          },
          {
            name: "Personal Saved Artworks Collection",
            description: "Curated personal collection vault with private notes and saved pieces.",
            requiredComponents: ["SavedArtworksGrid", "CollectionNotes", "ShareFolioButton"],
            requiredDataFields: ["artworkId", "savedAt", "personalNotes"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(museumDifferentiators, s, 2),
        dataModels: [
          { name: "Exhibition", fields: ["id", "title", "curator", "description", "startDate", "endDate", "wing"] },
          { name: "Artist", fields: ["id", "name", "bio", "nationality", "movement", "birthYear"] },
          { name: "Artwork", fields: ["id", "title", "artistId", "year", "medium", "dimensions", "imageUrl", "description"] },
          { name: "AudioTrack", fields: ["id", "title", "narrator", "durationSeconds", "artworkId", "exhibitionId", "audioUrl"] },
          { name: "VisitPlan", fields: ["id", "visitDate", "timeSlot", "partySize", "notes"] },
          { name: "SavedArtwork", fields: ["id", "artworkId", "notes", "savedAt"] },
        ],
      };
    }

    // 0b3. Luxury Boutique Hotel & Hospitality Experience (Velora House)
    if (/\b(hotel|boutique hotel|resort|hospitality|luxury stay|luxury suites|villa resort)\b/i.test(p)) {
      const hotelDifferentiators: FeatureSpec[] = [
        {
          name: "Sommelier Cellar Tasting & Private Dining",
          description: "Curated sommelier tastings, private wine vault dinners, and bespoke pairing menus.",
          requiredComponents: ["CellarReservationModal", "WineTastingMenu", "SommelierNotes"],
          requiredDataFields: ["tastingTier", "sommelierName", "cellarVintage", "reserveDate"],
        },
        {
          name: "Bespoke Sunset Excursions & Local Concierge",
          description: "Private yacht charters, cultural village excursions, and bespoke regional day trips.",
          requiredComponents: ["ExcursionScheduler", "CharterDetailDrawer", "ConciergeContactModal"],
          requiredDataFields: ["excursionTitle", "durationHours", "capacityGuests", "departureTime"],
        },
        {
          name: "Virtual Concierge Chat & Instant Services",
          description: "Interactive concierge assistant coordinating in-suite dining, pillow selections, and spa reservations.",
          requiredComponents: ["VirtualConciergeChat", "ServiceRequestModal", "StayPreferenceSelector"],
          requiredDataFields: ["guestName", "serviceCategory", "requestDetails", "preferredTime"],
        },
      ];

      return {
        category: "Luxury Hospitality & Boutique Hotel",
        experiencePattern: "hospitality-portal",
        primaryLandingFeature: "Curated Suites Showcase",
        corePages: [
          "/",
          "/suites",
          "/booking",
          "/stay-planner",
          "/guest-preferences",
          "/amenities-and-spa",
          "/dining",
          "/local-experiences",
        ],
        standardFeatures: [
          {
            name: "Curated Suites & Villas Showcase",
            description: "Cinematic photography, immersive room storytelling, floorplans, and suite appointments.",
            requiredComponents: ["SuiteHeroGallery", "SuiteCardGrid", "FloorplanDrawer"],
            requiredDataFields: ["suiteName", "tier", "capacity", "sqft", "nightlyRate", "amenities"],
          },
          {
            name: "Interactive Room Availability & Booking Engine",
            description: "Date-driven booking engine with real-time suite availability checks and rate calculations.",
            requiredComponents: ["DateRangePicker", "AvailabilityCalendar", "BookingSummaryModal"],
            requiredDataFields: ["checkInDate", "checkOutDate", "guests", "selectedSuiteId", "totalCost"],
          },
          {
            name: "Personalized Stay Planner & Itinerary Concierge",
            description: "Curated itinerary builder coordinating dining, spa treatments, and local excursions.",
            requiredComponents: ["StayPlannerTimeline", "ItineraryDaySelector", "AddExperienceDrawer"],
            requiredDataFields: ["stayDays", "scheduledActivities", "diningReservations", "specialRequests"],
          },
          {
            name: "Bespoke Guest Preferences & In-Suite Curation",
            description: "Pillow menu, arrival climate, beverage stocking, and personalized wellness requests.",
            requiredComponents: ["PreferenceSelector", "PillowMenuGrid", "ArrivalNoteInput"],
            requiredDataFields: ["pillowType", "temperatureTarget", "dietaryNeeds", "arrivalRequests"],
          },
          {
            name: "Property Amenities & Wellness Spa Sanctuary",
            description: "Thermal suites, infinity pool, spa ritual menus, and wellness retreat programming.",
            requiredComponents: ["AmenityShowcaseGrid", "SpaTreatmentMenu", "WellnessSchedule"],
            requiredDataFields: ["treatmentName", "durationMinutes", "treatmentPrice", "venueName"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(hotelDifferentiators, s, 2),
        dataModels: [
          { name: "Suite", fields: ["id", "name", "category", "pricePerNight", "maxGuests", "sqm", "description", "isAvailable"] },
          { name: "Reservation", fields: ["id", "guestName", "guestEmail", "suiteId", "checkIn", "checkOut", "totalAmount", "status"] },
          { name: "GuestPreference", fields: ["id", "guestEmail", "pillowType", "temperatureTarget", "dietaryNeeds", "arrivalNotes"] },
          { name: "StayPlan", fields: ["id", "reservationId", "dayNumber", "activityTitle", "scheduledTime", "category"] },
          { name: "Amenity", fields: ["id", "name", "category", "openingHours", "location", "isComplimentary"] },
        ],
      };
    }

    // 0b4. Renewable Energy Operations & Grid Telemetry (GreenPulse Energy)
    if (/\b(renewable|solar|wind|clean energy|greenpulse|energy operations|power grid|microgrid|photovoltaic|inverter|turbine)\b/i.test(p)) {
      const cleanEnergyDifferentiators: FeatureSpec[] = [
        {
          name: "Real-Time Generation Telemetry & Power Curve",
          description: "Live generation meters tracking utility-scale photovoltaic arrays, wind turbine yield, and transmission export.",
          requiredComponents: ["TelemetryStreamGrid", "PowerCurveCanvas", "GridFrequencyIndicator"],
          requiredDataFields: ["totalMegawatts", "solarYield", "windOutput", "gridFrequencyHz"],
        },
        {
          name: "Predictive Maintenance Dispatch & Inverter Health",
          description: "Field technician dispatch roster coordinating preventive work orders, turbine yaw overhauls, and inverter diagnostics.",
          requiredComponents: ["WorkOrderQueue", "TechnicianDispatchRoster", "MaintenanceTimeline"],
          requiredDataFields: ["workOrderId", "assignedTechnician", "priorityTier", "scheduledDate"],
        },
        {
          name: "Critical Grid Fault & Incident Triage Console",
          description: "Mission-critical incident triage queue with severity badges, alarm acknowledgment, and emergency curtailment.",
          requiredComponents: ["IncidentTriageQueue", "AlarmAcknowledgmentModal", "EscalationLog"],
          requiredDataFields: ["incidentId", "severity", "substationName", "tripTimestamp"],
        },
      ];

      return {
        category: "Renewable Energy Operations",
        experiencePattern: "operations-dashboard",
        primaryLandingFeature: "Operations Overview",
        corePages: ["/operations", "/assets", "/analytics", "/maintenance", "/incidents", "/reports"],
        standardFeatures: [
          {
            name: "Operations Overview",
            description: "Central command dashboard with renewable energy generation trends and operational status metrics.",
            requiredComponents: ["OperationsDashboard", "GenerationMetricsCard", "LiveGridStatus"],
            requiredDataFields: ["generationMw", "capacityFactor", "activeTurbines", "inverterStatus"],
          },
          {
            name: "Solar Farm & Wind Turbine Asset Inventory",
            description: "Asset inventory ledger tracking solar inverters, wind turbines, nameplate capacity, and operating status.",
            requiredComponents: ["AssetInventoryTable", "CapacityFilter", "AssetTelemetryDrawer"],
            requiredDataFields: ["assetId", "name", "type", "capacityRating", "operatingStatus"],
          },
          {
            name: "Grid Telemetry & Environmental Analytics",
            description: "High-frequency telemetry analysis, curtailment metrics, and emissions abatement trends.",
            requiredComponents: ["TelemetryAnalysisCanvas", "CarbonOffsetCounter", "CurtailmentMetrics"],
            requiredDataFields: ["carbonOffsetTonnes", "curtailmentMwh", "reactivePowerMvar"],
          },
          {
            name: "Maintenance Dispatch & Work Orders",
            description: "Preventive maintenance scheduling and technician work order management.",
            requiredComponents: ["MaintenanceWorkOrderList", "TechnicianAssignmentModal", "PreventiveSchedule"],
            requiredDataFields: ["orderNumber", "assetTarget", "technicianName", "dueDate"],
          },
          {
            name: "Critical Operational Alerts & Incidents",
            description: "Real-time fault monitoring, grid trip alerts, and emergency escalation workflows.",
            requiredComponents: ["IncidentAlertBanner", "FaultSeverityBadge", "ResolutionActions"],
            requiredDataFields: ["alertId", "faultCode", "affectedAsset", "status"],
          },
          {
            name: "Generation Compliance & Executive Reports",
            description: "Regulatory generation compliance records, utility settlement logs, and exportable executive summaries.",
            requiredComponents: ["ComplianceReportMatrix", "SettlementSummary", "ExportActionToolbar"],
            requiredDataFields: ["reportPeriod", "ppaDeliveredMwh", "complianceStatus"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(cleanEnergyDifferentiators, s, 2),
        dataModels: [
          { name: "Asset", fields: ["id", "name", "type", "capacityMw", "status", "location", "lastInspected"] },
          { name: "TelemetryPoint", fields: ["id", "assetId", "metric", "value", "unit", "timestamp"] },
          { name: "Alert", fields: ["id", "assetId", "severity", "code", "message", "acknowledged", "createdAt"] },
          { name: "WorkOrder", fields: ["id", "assetId", "technician", "priority", "description", "status", "dueDate"] },
          { name: "GenerationReport", fields: ["id", "period", "totalOutputMwh", "carbonAvoidedTonnes", "complianceStatus"] },
        ],
      };
    }

    // 0c. Critical Architecture Journal / Spatial Monograph
    const isSoftwareOrSystemArch = /\b(software architecture|system architecture|data architecture|application architecture|required by the architecture|backend architecture|cloud architecture|architecture and engineering|architecture requirements)\b/i.test(p);
    const isActualArchitectureJournal = !isSoftwareOrSystemArch && /\b(architectural\s+(?:monograph|journal|review|digest|firm|studio|practice|portfolio|criticism)|architecture\s+(?:firm|studio|monograph|journal|magazine|exhibition)|building\s+typolog(?:y|ies)|spatial\s+(?:monograph|essay)|tectonic\s+journal)\b/i.test(p);
    if (isActualArchitectureJournal) {
      const archDifferentiators: FeatureSpec[] = [
        {
          name: "Full-Bleed Spatial Case Study Monograph",
          description: "Uncompressed medium-format structural photography, tectonic sections, and critical spatial narrative.",
          requiredComponents: ["MonographViewer", "TectonicSectionDrawer", "MaterialLegend"],
          requiredDataFields: ["projectName", "architect", "typology", "completionYear", "location"],
        },
        {
          name: "Architectural Discourse & Critical Essays",
          description: "Longform critical essays examining contemporary urbanism, monolithic concrete, and structural timber.",
          requiredComponents: ["EssayReader", "CitationList", "ReadingProgress"],
          requiredDataFields: ["title", "author", "readTimeMinutes", "publicationDate", "abstract"],
        },
      ];

      return {
        category: "Critical Architecture Journal",
        experiencePattern: "craft-editorial",
        primaryLandingFeature: "Spatial Monograph",
        corePages: ["/", "/essays", "/case-studies", "/architects", "/archive"],
        standardFeatures: [
          {
            name: "Spatial Monograph",
            description: "Curated longform visual essays with asymmetric layout, oversized display typography, and full-screen imagery.",
            requiredComponents: ["MonographHero", "VisualEssayFlow", "ArchitectProfileBadge"],
            requiredDataFields: ["monographTitle", "leadArchitect", "photographerCredit", "curatorialNotes"],
          },
          {
            name: "Architectural Typology Archive",
            description: "Searchable spatial registry organized by material, geography, and structural system.",
            requiredComponents: ["FolioArchiveGrid", "TypologyFilter", "DrawingInspector"],
            requiredDataFields: ["structuralSystem", "primaryMaterial", "climateZone"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(archDifferentiators, s, 2),
        dataModels: [
          { name: "Monograph", fields: ["id", "title", "subtitle", "leadImage", "essayBody", "publishedDate"] },
          { name: "CaseStudy", fields: ["id", "projectName", "architect", "typology", "location", "year"] },
          { name: "ArchitectProfile", fields: ["id", "name", "studioName", "city", "bio", "notableWorks"] },
        ],
      };
    }

    // 0d. Culinary Travel Magazine / Gastronomy Journal
    if (/\b(culinary|food travel|gastronom|food journey|recipe collection|chef stories|culinary travel|taste atlas|terroir)\b/i.test(p)) {
      const culinaryDifferentiators: FeatureSpec[] = [
        {
          name: "Terroir Soil & Microclimate Produce Matrix",
          description: "Regional soil composition, harvest calendars, and indigenous ingredient profiles.",
          requiredComponents: ["TerroirAtlasMap", "HarvestCalendarMatrix", "SoilProfileDrawer"],
          requiredDataFields: ["regionName", "soilType", "seasonalIngredients", "elevationMeters"],
        },
        {
          name: "Artisan Fermentation & Technique Chronicle",
          description: "Step-by-step masterclass documentation of heritage wood-fire and subterranean aging techniques.",
          requiredComponents: ["TechniqueGuideSpread", "FermentationTimeline", "ChefQuoteCallout"],
          requiredDataFields: ["techniqueName", "artisanName", "agingMonths", "culturalOrigin"],
        },
      ];

      return {
        category: "Culinary Travel Magazine & Gastronomic Journal",
        experiencePattern: "craft-editorial",
        primaryLandingFeature: "Editorial Monograph & Regional Food Stories",
        corePages: ["/", "/editorial-stories", "/explore-culinary-destinations", "/and-filter-recipes", "/saved-discoveries", "/build-custom-itinerary"],
        standardFeatures: [
          {
            name: "Editorial Monograph & Regional Food Stories",
            description: "Immersive food-story cover with longform photo essays, author monographs, and pull quotes.",
            requiredComponents: ["EditorialCoverHero", "PhotoEssaySpread", "DropCapNarrative"],
            requiredDataFields: ["storyTitle", "leadChef", "regionOrigin", "readTimeMinutes"],
          },
          {
            name: "Culinary Destination Explorer",
            description: "Interactive regional destination atlas featuring terroir profiles, local markets, and dining spots.",
            requiredComponents: ["DestinationAtlasGrid", "RegionFilterBar", "TerroirNotesDrawer"],
            requiredDataFields: ["destinationName", "country", "primaryIngredients", "marketHighlights"],
          },
          {
            name: "Curated Recipe Collection & Kitchen Companion",
            description: "Tactile recipe collection with serving scaler and step-by-step masterclass cooking mode.",
            requiredComponents: ["RecipeCardGrid", "ServingScaler", "StepCookingModeModal"],
            requiredDataFields: ["recipeTitle", "prepTimeMinutes", "difficulty", "ingredients", "instructions"],
          },
          {
            name: "Personal Saved Discoveries Hub",
            description: "Curated bookmarking hub organizing favorite stories, recipes, and travel spots into custom folders.",
            requiredComponents: ["SavedCollectionsHub", "FolderFilterTabs", "DiscoveryBookmarkCard"],
            requiredDataFields: ["savedTitle", "itemType", "folderName", "savedDate"],
          },
          {
            name: "Custom Culinary Itinerary Planner",
            description: "Multi-day culinary journey planner scheduling dining reservations, food markets, and cooking classes.",
            requiredComponents: ["ItineraryTimeline", "DayScheduleTabs", "CulinaryStopCard"],
            requiredDataFields: ["itineraryDay", "stopTime", "stopTitle", "stopType", "notes"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(culinaryDifferentiators, s, 2),
        dataModels: [
          { name: "Article", fields: ["id", "title", "excerpt", "body", "author", "readTime", "heroImage", "publishedAt"] },
          { name: "Destination", fields: ["id", "name", "region", "country", "description", "terroirNotes", "bestSeason"] },
          { name: "Recipe", fields: ["id", "title", "prepTime", "cookTime", "difficulty", "servings", "ingredients", "instructions", "category"] },
          { name: "SavedItem", fields: ["id", "title", "itemType", "itemId", "folder", "notes", "savedAt"] },
          { name: "ItineraryDay", fields: ["id", "dayNumber", "date", "theme"] },
          { name: "ItineraryItem", fields: ["id", "dayId", "time", "title", "type", "notes"] },
        ],
      };
    }

    // 1. Hospitality / Resort / Hotel
    if (p.includes("resort") || p.includes("hotel") || p.includes("hospitality") || p.includes("villa") || p.includes("vacation")) {
      const resortDifferentiators: FeatureSpec[] = [
        {
          name: "Private Concierge Excursion Booking",
          description: "Curated island yacht tours and helicopter transfers.",
          requiredComponents: ["ExcursionPlanner", "ConciergeRequestForm"],
          requiredDataFields: ["activityTitle", "duration", "guideName", "price"],
        },
        {
          name: "Holistic Wellness & Spa Sanctuary",
          description: "Signature treatment booking with therapist specialization.",
          requiredComponents: ["SpaTreatmentMenu", "TherapistSelector"],
          requiredDataFields: ["treatmentName", "durationMinutes", "focusArea"],
        },
        {
          name: "Sommelier Sunset Cellar Tasting",
          description: "Private vintage cellar reservation with master sommelier pairings.",
          requiredComponents: ["WineTastingCard", "SommelierBookingModal"],
          requiredDataFields: ["vintageYear", "sommelierName", "tastingTier"],
        },
        {
          name: "Bespoke Starlight Beach Dining",
          description: "Exclusive private beach dinner with custom chef menu.",
          requiredComponents: ["PrivateDiningCard", "CourseCustomizer"],
          requiredDataFields: ["locationSlot", "chefSpecialty", "guestCount"],
        },
      ];

      return {
        category: "Luxury Hospitality & Resort",
        experiencePattern: "hospitality-portal",
        primaryLandingFeature: "Villa & Suite Showcase",
        corePages: ["/", "/villas", "/experiences", "/dining", "/reservations"],
        standardFeatures: [
          {
            name: "Villa & Suite Showcase",
            description: "Room selection with amenity tags, occupancy limits, and square footage details.",
            requiredComponents: ["VillaCardGrid", "AmenityFilter", "RoomDetailDrawer"],
            requiredDataFields: ["name", "pricePerNight", "capacity", "sqFt", "amenities", "viewType"],
          },
          {
            name: "Multi-Step Reservation Flow",
            description: "Date-range picker, guest count selection, and room availability check.",
            requiredComponents: ["DateRangePicker", "GuestSelector", "BookingSummaryCard"],
            requiredDataFields: ["checkIn", "checkOut", "guests", "selectedVillaId", "totalCost"],
          },
          {
            name: "Culinary & Dining Guide",
            description: "On-site restaurant menus, chef tasting notes, and table reservation request.",
            requiredComponents: ["RestaurantCard", "MenuViewer", "TableReservationModal"],
            requiredDataFields: ["restaurantName", "cuisine", "hours", "reservationSlot"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(resortDifferentiators, s, 2),
        dataModels: [
          { name: "Accommodation", fields: ["id", "title", "tier", "pricePerNight", "maxGuests", "isAvailable"] },
          { name: "Reservation", fields: ["id", "guestName", "checkIn", "checkOut", "totalAmount", "status"] },
          { name: "Experience", fields: ["id", "title", "durationHours", "price", "category"] },
        ],
      };
    }

    // 2. Automotive / Car Wash / Detailing
    if (/\b(car wash|auto spa|detailing|auto detail|car detail|wash bay)\b/i.test(p)) {
      const carWashDifferentiators: FeatureSpec[] = [
        {
          name: "Live Bay Progress Tracker",
          description: "Real-time wash status updates (Pre-soak, Hand Wash, Ceramic Coating, QC).",
          requiredComponents: ["BayStatusMeter", "LiveTimelineView"],
          requiredDataFields: ["ticketNumber", "currentStage", "estimatedCompletion"],
        },
        {
          name: "Unlimited Wash Club Subscription",
          description: "Monthly membership pass with license plate recognition pass.",
          requiredComponents: ["MembershipTierCard", "LicensePlateInput"],
          requiredDataFields: ["plateNumber", "tier", "billingCycle"],
        },
        {
          name: "Ceramic Coating Hydrophobic Inspection",
          description: "Optical gloss rating and paint sealant longevity meter.",
          requiredComponents: ["GlossMeterCard", "PaintInspectionDiagram"],
          requiredDataFields: ["glossReading", "coatWarrantyMonths", "paintCondition"],
        },
        {
          name: "Fleet Corporate Detailing Portal",
          description: "Multi-vehicle commercial account scheduling and consolidated billing.",
          requiredComponents: ["FleetOverviewTable", "BulkSchedulerModal"],
          requiredDataFields: ["fleetId", "vehicleCount", "monthlyRate"],
        },
        {
          name: "Touchless Express Lane RFID Check-In",
          description: "Automated gate sensor check-in with stored wash profile preferences.",
          requiredComponents: ["ExpressLaneCard", "RfidSensorSimulator"],
          requiredDataFields: ["tagId", "washProfile", "gateStatus"],
        },
      ];

      return {
        category: "Automotive Detailing & Care",
        experiencePattern: "booking-flow",
        primaryLandingFeature: "Service Tier Comparison",
        corePages: ["/", "/services", "/booking", "/locations", "/membership"],
        standardFeatures: [
          {
            name: "Service Tier Comparison",
            description: "Transparent breakdown of Express, Deluxe, and Ceramic detailing packages.",
            requiredComponents: ["PricingMatrix", "FeatureChecklist", "VehicleTypeSelector"],
            requiredDataFields: ["packageName", "price", "durationMinutes", "includedServices"],
          },
          {
            name: "Vehicle Size & Condition Selector",
            description: "Sedan, SUV, Truck pricing adjustments and paint condition assessment.",
            requiredComponents: ["VehicleClassTabs", "ConditionAddOnToggle"],
            requiredDataFields: ["vehicleType", "surcharge", "notes"],
          },
          {
            name: "Time-Slot Appointment Scheduler",
            description: "Bay availability schedule with instant confirmation.",
            requiredComponents: ["TimeSlotPicker", "AppointmentConfirmationCard"],
            requiredDataFields: ["dateTime", "bayNumber", "technician", "customerPhone"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(carWashDifferentiators, s, 2),
        dataModels: [
          { name: "ServicePackage", fields: ["id", "name", "basePrice", "durationMinutes", "features"] },
          { name: "Appointment", fields: ["id", "customerName", "vehiclePlate", "scheduledAt", "status"] },
          { name: "Membership", fields: ["id", "memberId", "planTier", "active"] },
        ],
      };
    }

    // 3. SaaS / Project Management / Engineering
    const isExplicitlyAntiSaas = /\b(avoid|no|not|without|never)\s+(?:any\s+)?(?:saas|dashboard)/i.test(p);
    if (!isExplicitlyAntiSaas && /\b(saas|sprint backlog|scrum board|kanban board|jira|linear|engineering sprint)\b/i.test(p) && !p.includes("soundboard") && !p.includes("fantasy")) {
      const saasDifferentiators: FeatureSpec[] = [
        {
          name: "Automated PR Blast-Radius Risk Score",
          description: "Evaluates dependency blast radius and code complexity before merging.",
          requiredComponents: ["BlastRadiusBadge", "RiskAnalysisDrawer"],
          requiredDataFields: ["riskLevel", "affectedComponents", "testCoverage"],
        },
        {
          name: "AI Standup & Blocker Digest",
          description: "Synthesizes daily activity into clear executive highlights.",
          requiredComponents: ["StandupDigestCard", "BlockerAlertList"],
          requiredDataFields: ["summaryText", "blockersDetected", "timestamp"],
        },
        {
          name: "Real-Time Sprint Velocity Simulator",
          description: "Monte Carlo delivery forecast based on team historical story-point throughput.",
          requiredComponents: ["VelocitySimulatorChart", "ForecastSlider"],
          requiredDataFields: ["simulatedConfidence", "projectedDeliveryDate"],
        },
        {
          name: "Cross-Service Dependency Heatmap",
          description: "Interactive visual matrix of inter-team API blockers and milestones.",
          requiredComponents: ["DependencyMatrixView", "BlockerConnector"],
          requiredDataFields: ["serviceSource", "serviceTarget", "isBlocking"],
        },
      ];

      return {
        category: "SaaS Project & Sprint Workspace",
        experiencePattern: "operations-dashboard",
        primaryLandingFeature: "Sprint Backlog & Task Management",
        corePages: ["/", "/sprints", "/backlog", "/roadmap", "/analytics"],
        standardFeatures: [
          {
            name: "Sprint Backlog & Task Management",
            description: "Prioritized task list with story points, assignees, and status tags.",
            requiredComponents: ["TaskListView", "StatusFilterBar", "NewTaskModal"],
            requiredDataFields: ["title", "status", "points", "assignee", "priority"],
          },
          {
            name: "Interactive Workflow Board",
            description: "Drag/column state transitions (To Do, In Progress, Code Review, Done).",
            requiredComponents: ["WorkflowColumns", "TaskCard", "DetailInspector"],
            requiredDataFields: ["cardId", "columnId", "tags", "dueDate"],
          },
          {
            name: "Velocity & Burn-down Analytics",
            description: "Sprint burn-down metrics and completion percentage tracking.",
            requiredComponents: ["VelocityChart", "MetricKpiRow"],
            requiredDataFields: ["sprintNumber", "plannedPoints", "completedPoints"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(saasDifferentiators, s, 2),
        dataModels: [
          { name: "TaskItem", fields: ["id", "title", "description", "status", "priority", "points"] },
          { name: "Sprint", fields: ["id", "name", "startDate", "endDate", "isActive"] },
          { name: "TeamMember", fields: ["id", "name", "email", "role"] },
        ],
      };
    }

    // 4. Bakery / Food / Restaurant
    if (p.includes("bakery") || p.includes("bread") || p.includes("cake") || p.includes("pastry") || p.includes("food") || p.includes("coffee")) {
      const bakeryDifferentiators: FeatureSpec[] = [
        {
          name: "Interactive Custom Cake Studio",
          description: "Multi-tier flavor, frosting, filling, and decorative inscription builder.",
          requiredComponents: ["CakeTierConfigurator", "FrostingPaletteSelector", "QuoteCalculator"],
          requiredDataFields: ["tierCount", "flavor", "filling", "inscriptionText", "estimatedPrice"],
        },
        {
          name: "Sourdough Starter & Sourcing Journal",
          description: "Heritage grain farm provenance and starter age chronicle.",
          requiredComponents: ["GrainProvenanceMap", "FermentationTimeline"],
          requiredDataFields: ["grainOrigin", "fermentationHours", "batchNumber"],
        },
        {
          name: "Weekly Artisan Loaf Bread Subscription",
          description: "Automated recurring warm loaf deliveries with baker's choice rotation.",
          requiredComponents: ["SubscriptionPlanCard", "LoafPreferenceSelector"],
          requiredDataFields: ["frequency", "selectedLoafTypes", "deliveryDay"],
        },
        {
          name: "Patisserie Masterclass Tasting Workshop",
          description: "Hands-on croissant lamination and sourdough workshop booking.",
          requiredComponents: ["WorkshopCard", "SeatReservationModal"],
          requiredDataFields: ["classTitle", "availableSeats", "instructorName"],
        },
      ];

      return {
        category: "Artisan Bakery & Patisserie",
        experiencePattern: characteristics?.experiencePattern || "booking-flow",
        primaryLandingFeature: "Daily Fresh Bread & Pastry Catalog",
        corePages: ["/", "/menu", "/custom-cakes", "/catering", "/about"],
        standardFeatures: [
          {
            name: "Daily Fresh Bread & Pastry Catalog",
            description: "Morning bake list with real-time in-stock and sold-out badges.",
            requiredComponents: ["BakeCatalogGrid", "DietaryFilterChips", "StockStatusBadge"],
            requiredDataFields: ["itemTitle", "price", "dietaryTags", "flourType", "inStock"],
          },
          {
            name: "Order Ahead & Curbside Pickup",
            description: "Time-selection for warm loaf pickup and order assembly.",
            requiredComponents: ["PickupTimeSelector", "CartDrawer"],
            requiredDataFields: ["orderItems", "pickupTime", "customerName", "subtotal"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(bakeryDifferentiators, s, 2),
        dataModels: [
          { name: "BakedGood", fields: ["id", "title", "price", "category", "inStock", "allergens"] },
          { name: "CustomOrder", fields: ["id", "customerName", "eventDate", "details", "priceQuote"] },
          { name: "PickupSlot", fields: ["id", "time", "availableSlots"] },
        ],
      };
    }

    // 5. Retail / E-Commerce / Marketplace
    if (/\b(retail|ecommerce|e-commerce|marketplace|storefront|online store)\b/i.test(p) || (/\bshop\b/i.test(p) && !p.includes("workshop"))) {
      const retailDifferentiators: FeatureSpec[] = [
        {
          name: "Lightning Flash Deal Countdown & Stock Meter",
          description: "Live countdown timer with real-time stock claim progress bar.",
          requiredComponents: ["CountdownTimer", "StockClaimProgress", "FlashSaleBadge"],
          requiredDataFields: ["endsAt", "claimedPercent", "discountPercent"],
        },
        {
          name: "Interactive Slide-Out Shopping Cart Drawer",
          description: "Persistent cart drawer with instant quantity increment and order summary.",
          requiredComponents: ["CartDrawer", "CartItemRow", "PriceSummary"],
          requiredDataFields: ["cartItems", "itemCount", "orderTotal"],
        },
        {
          name: "Delivery Courier Serviceability Checker",
          description: "Instant pincode verification with estimated delivery date calculation.",
          requiredComponents: ["PincodeInput", "EstimatedDeliveryBadge"],
          requiredDataFields: ["pincode", "isAvailable", "deliveryDays"],
        },
      ];

      return {
        category: "Consumer E-Commerce & Retail Marketplace",
        experiencePattern: "storefront-commerce",
        primaryLandingFeature: "Product Catalog Grid with Discounts",
        corePages: ["/", "/deals", "/categories", "/cart"],
        standardFeatures: [
          {
            name: "Promotional Banner Carousel",
            description: "High-impact seasonal campaign carousel with shop now CTA.",
            requiredComponents: ["BannerCarousel", "HeroSlide", "PromotionBadge"],
            requiredDataFields: ["bannerTitle", "promoTag", "imageUrl", "ctaLink"],
          },
          {
            name: "Top Category Quick-Nav Row",
            description: "Horizontal icon row for instant department filtering.",
            requiredComponents: ["CategoryIconRow", "CategoryPill"],
            requiredDataFields: ["name", "iconName", "productCount"],
          },
          {
            name: "Product Catalog Grid with Discounts",
            description: "Card grid showing star ratings, strike-through prices, and discount badges.",
            requiredComponents: ["ProductCard", "StarRating", "DiscountBadge", "AddToCartButton"],
            requiredDataFields: ["title", "rating", "price", "strikePrice", "discountPercentage"],
          },
        ],
        differentiatorFeatures: this.selectDifferentiators(retailDifferentiators, s, 2),
        dataModels: [
          { name: "Product", fields: ["id", "title", "price", "strikePrice", "discountPercentage", "rating", "category", "inStock"] },
          { name: "CartItem", fields: ["id", "productId", "quantity", "unitPrice"] },
          { name: "Order", fields: ["id", "orderNumber", "totalAmount", "status", "shippingPincode"] },
        ],
      };
    }

    // 6. Default General Business
    const generalDifferentiators: FeatureSpec[] = [
      {
        name: "Interactive Real-Time Cost Estimator",
        description: "Dynamic pricing calculator updating as parameters are adjusted.",
        requiredComponents: ["CostEstimatorSlider", "QuoteBreakdownCard"],
        requiredDataFields: ["parameters", "calculatedTotal", "tierLevel"],
      },
      {
        name: "Client Verification & Satisfaction Guarantee",
        description: "Transparent guarantee metrics with verified client satisfaction ratings.",
        requiredComponents: ["GuaranteeBadge", "MetricProgressRing"],
        requiredDataFields: ["satisfactionScore", "guaranteeText"],
      },
      {
        name: "Priority Service SLA Express Queue",
        description: "Expedited turnaround tracking with guaranteed SLA response timestamps.",
        requiredComponents: ["SlaStatusTracker", "UrgencyBadge"],
        requiredDataFields: ["slaHours", "priorityLevel"],
      },
    ];

    return {
      category: "Digital Business Platform",
      experiencePattern: characteristics.experiencePattern || "operations-dashboard",
      primaryLandingFeature: "Interactive Service & Offer Catalog",
      corePages: ["/", "/services", "/catalog", "/about", "/contact"],
      standardFeatures: [
        {
          name: "Interactive Service & Offer Catalog",
          description: "Searchable, filterable list of products or services with pricing and details.",
          requiredComponents: ["CatalogGrid", "CategoryTabs", "ItemDetailModal"],
          requiredDataFields: ["title", "category", "price", "description"],
        },
        {
          name: "Direct Client Inquiry & Booking Flow",
          description: "Structured form with instant validation and response timeline.",
          requiredComponents: ["ContactForm", "ConfirmationNotice"],
          requiredDataFields: ["name", "email", "serviceRequested", "message"],
        },
      ],
      differentiatorFeatures: this.selectDifferentiators(generalDifferentiators, s, 2),
      dataModels: [
        { name: "ProductService", fields: ["id", "title", "price", "category", "description"] },
        { name: "Inquiry", fields: ["id", "clientName", "clientEmail", "status", "submittedAt"] },
      ],
    };
  }
}
