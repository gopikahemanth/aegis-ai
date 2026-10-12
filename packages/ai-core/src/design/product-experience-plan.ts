import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ProductDesignBrief } from "./design-director.js";
import {
  type ExperienceCapabilityPlan,
  ExperienceCapabilityResolver,
} from "./experience-capability-plan.js";
import { ExperienceArchitect } from "./experience-architect.js";
import type { CompositionGraph } from "./composition-graph.js";
import { type NavigationDesign, NavigationDesignResolver } from "./navigation-design.js";
import {
  type WebsiteExperienceIdentity,
  WebsiteExperienceIdentityResolver,
} from "./website-experience-identity.js";
import {
  type PageExperiencePlan,
  PageExperiencePlanner,
} from "./page-experience-plan.js";

export interface RequiredCapability {
  id: string;
  name: string;
  evidenceVocabulary: string[];
  controlsRequired: string[];
  testInteraction?: {
    controlType: "button" | "input" | "select" | "slider";
    action: "click" | "input" | "change";
  };
}

export interface ProductExperiencePlan {
  planId: string;
  generationSeed?: number;
  compositionStrategy?: string;
  experiencePattern: string;
  experienceCapability: ExperienceCapabilityPlan;
  compositionGraph: CompositionGraph;
  navigationDesign?: NavigationDesign;
  experienceIdentity?: WebsiteExperienceIdentity;
  pagePlans?: PageExperiencePlan[];
  expectedHomeRoute: string;
  primaryLandingFeature?: string;
  primaryActivity: string;
  requiredCapabilities: RequiredCapability[];
  forbiddenVocabulary: string[];
  forbiddenArtifacts: string[];
  expectedRoutes: string[];
  authWallAllowed: boolean;
}

export class ProductExperiencePlanManager {
  /**
   * Derives an authoritative, locked ProductExperiencePlan from the design brief, specification, and prompt.
   */
  public static build(
    brief: ProductDesignBrief,
    specification: any,
    prompt: string,
    domainContract?: any
  ): ProductExperiencePlan {
    const rawPrompt = prompt || specification?.userPrompt || "";
    const lowerPrompt = rawPrompt.toLowerCase();

    // Deterministically resolve high-level experience capability & rendering requirements
    const experienceCapability = ExperienceCapabilityResolver.resolve(
      rawPrompt,
      brief.productCharacteristics,
      specification
    );

    // Check if user explicitly asked for an authentication portal
    const authWallAllowed = Boolean(
      lowerPrompt.includes("authentication system") ||
      lowerPrompt.includes("login portal") ||
      lowerPrompt.includes("auth service") ||
      lowerPrompt.includes("sso platform")
    );

    const experiencePattern = brief.productCharacteristics.experiencePattern;
    const expectedHomeRoute = "/";

    // Extract required capabilities from prompt, brief, and specification
    const requiredCapabilities: RequiredCapability[] = [];

    // If Real 3D is required, inject the mandatory 3D interactive world capability first
    if (experienceCapability.real3dRequired) {
      requiredCapabilities.push({
        id: "interactive-3d-world",
        name: "Interactive 3D Universe World Stage",
        evidenceVocabulary: [
          "world", "explore", "scene", "camera", "journey", "quest",
          "sound", "characters", "3d", "atmosphere", "stage", "biomes"
        ],
        controlsRequired: ["canvas", "button"],
        testInteraction: { controlType: "button", action: "click" },
      });
    }

    // Helper to add capability if matching keywords present
    const addIfMatching = (
      id: string,
      name: string,
      triggers: string[],
      vocab: string[],
      controls: string[],
      interaction?: RequiredCapability["testInteraction"]
    ) => {
      if (triggers.some(t => {
        const escaped = t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
        return regex.test(lowerPrompt);
      })) {
        requiredCapabilities.push({
          id,
          name,
          evidenceVocabulary: vocab,
          controlsRequired: controls,
          testInteraction: interaction || { controlType: "button", action: "click" },
        });
      }
    };

    // 1. Domain specific capability detection
    addIfMatching(
      "fixture-configurator",
      "Custom Fixture Configurator",
      ["fixture", "configurator", "luminaire", "lighting fixture"],
      ["fixture", "configur", "lighting", "optic", "finish", "dimension", "mounting"],
      ["button", "select", "input"],
      { controlType: "select", action: "change" }
    );

    addIfMatching(
      "photometric-calculator",
      "Photometric Lux Distribution Calculator",
      ["photometric", "lux", "distribution calculator", "lighting calculation"],
      ["lux", "photometric", "distribution", "lumens", "wattage", "footcandle", "calculate", "intensity"],
      ["input", "button"],
      { controlType: "input", action: "input" }
    );

    addIfMatching(
      "quote-estimator",
      "Project Quote Estimator",
      ["quote", "estimator", "cost estimation", "project quote"],
      ["quote", "estimat", "cost", "price", "budget", "breakdown", "total"],
      ["input", "button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "glaze-calculator",
      "Glaze Chemistry Calculator",
      ["glaze", "chemistry", "formulation"],
      ["glaze", "chemistry", "formula", "oxide", "flux", "stoechiometric", "silica", "alumina"],
      ["input", "button"],
      { controlType: "input", action: "input" }
    );

    addIfMatching(
      "kiln-monitor",
      "Kiln Firing Schedule Monitor",
      ["kiln", "firing", "temperature schedule", "pyrometer"],
      ["kiln", "firing", "temperature", "schedule", "ramp", "soak", "cone"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "solar-telemetry",
      "Solar Array Telemetry Dashboard",
      ["solar telemetry", "solar array", "photovoltaic", "array telemetry", "live inverter", "solar"],
      ["telemetry", "inverter", "solar", "kilowatt", "kwh", "yield", "voltage", "power", "grid", "efficiency", "generation", "array"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "maintenance-scheduler",
      "Maintenance Alert Scheduling",
      ["maintenance", "alert scheduling", "service schedule", "work order"],
      ["maintenance", "alert", "schedule", "service", "inspection", "technician", "repair", "status", "dispatch"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "system-alerts",
      "System Alert Monitor",
      ["alerts", "alarm", "monitoring alert"],
      ["alert", "alarm", "warning", "critical", "threshold", "notification", "resolved", "active"],
      ["button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "energy-analytics",
      "Energy Yield Analytics",
      ["yield", "analytics", "kilowatt-hour", "daily yield", "consumption"],
      ["yield", "analytics", "kilowatt", "consumption", "daily", "trend", "generation", "peak", "metrics"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "commission-manager",
      "Bespoke Commission Request Manager",
      ["commission", "bespoke", "custom piece", "client request"],
      ["commission", "request", "bespoke", "client", "custom", "quote", "milestone", "deposit"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "inventory-manager",
      "Material Inventory System",
      ["inventory", "stock", "raw material", "warehouse"],
      ["inventory", "stock", "material", "quantity", "unit", "supplier", "batch", "reorder"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    // Aeronautical Telemetry & Flight Operations capabilities
    addIfMatching(
      "aircraft-fleet",
      "Aircraft Fleet Registry & Inspector",
      ["aircraft fleet", "fleet registry", "aircraft selection", "aircraft inspector", "aircraft", "fleet"],
      ["aircraft", "fleet", "tail", "model", "inspector", "registration", "airframe", "avionics", "status"],
      ["button", "table"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "flight-operations",
      "Flight Operations & Navigation Workspace",
      ["flight operations", "flight monitoring", "navigation waypoint", "route waypoints", "altitude profile", "waypoints"],
      ["flight", "waypoint", "altitude", "heading", "air speed", "navigation", "coordinates", "route", "climb", "descent"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "engine-telemetry",
      "Engine Telemetry & Threshold Monitor",
      ["engine telemetry", "engine load", "telemetry threshold", "vibration", "fuel consumption", "engine"],
      ["engine", "telemetry", "temperature", "pressure", "vibration", "fuel", "thrust", "n1", "egt", "threshold", "alert", "rpm"],
      ["button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "avionics-instruments",
      "Avionics Instrumentation & Calibration",
      ["avionics instrument", "instrument mode", "calibration workflow", "avionics instrumentation", "avionics", "instrument"],
      ["avionics", "instrument", "mode", "calibration", "attitude", "altimeter", "horizon", "gauge", "telemetry"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "flight-plan-analysis",
      "Flight-Plan Analysis & Waypoint Inspection",
      ["flight-plan", "flight plan", "waypoint inspection", "flight-plan comparison"],
      ["flight plan", "plan", "waypoint", "corridor", "distance", "fuel estimate", "eta", "fix", "origin", "destination"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "notam-notices",
      "NOTAM & Operational Notices Desk",
      ["notam", "operational notices", "notice acknowledgement", "notam notices", "notices"],
      ["notam", "notice", "advisory", "runway", "airspace", "acknowledge", "briefing", "effective", "hazard"],
      ["button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "flight-events",
      "Flight-Event Timeline & Investigation",
      ["flight-event", "flight event", "event investigation", "event timeline", "investigation"],
      ["event", "incident", "investigation", "timeline", "telemetry trace", "severity", "timestamp", "recorder"],
      ["button"],
      { controlType: "button", action: "click" }
    );

    // ── STOREFRONT: Discovery-driven retail commerce capabilities ─────────────
    if (experiencePattern === "storefront-commerce") {
      const isBakeryOrFood = lowerPrompt.includes("bakery") || lowerPrompt.includes("bread") || lowerPrompt.includes("pastry") || lowerPrompt.includes("cake") || lowerPrompt.includes("food") || lowerPrompt.includes("cafe");

      // 1. Mandatory core retail capabilities: Product Catalog & Cart
      if (!requiredCapabilities.some(c => c.id === "product-catalog" || c.id === "daily-menu")) {
        requiredCapabilities.push({
          id: isBakeryOrFood ? "daily-menu" : "product-catalog",
          name: isBakeryOrFood ? "Daily Bread & Fresh Bakes Menu" : "Product Catalog Grid",
          evidenceVocabulary: isBakeryOrFood
            ? ["menu", "bread", "pastry", "sourdough", "loaves", "croissant", "price", "order", "bag", "bakes", "fresh"]
            : ["product", "catalog", "grid", "price", "add to cart", "rating", "item"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      if (!requiredCapabilities.some(c => c.id === "cart-drawer")) {
        requiredCapabilities.push({
          id: "cart-drawer",
          name: isBakeryOrFood ? "Artisan Bakery Order Bag & Cart" : "Slide-Out Shopping Cart Drawer",
          evidenceVocabulary: ["cart", "bag", "checkout", "subtotal", "quantity", "order"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      // 2. Discovery-driven capabilities (ONLY if requested in prompt):
      // Custom cake ordering/builder
      if (lowerPrompt.includes("cake") || lowerPrompt.includes("custom order") || lowerPrompt.includes("cake ordering")) {
        if (!requiredCapabilities.some(c => c.id === "custom-cake-builder")) {
          requiredCapabilities.push({
            id: "custom-cake-builder",
            name: "Custom Cake Ordering Configurator",
            evidenceVocabulary: ["cake", "custom", "tiers", "flavor", "frosting", "sponge", "inscription", "size", "order"],
            controlsRequired: ["select", "button", "input"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Pickup scheduler
      if (lowerPrompt.includes("pickup") || lowerPrompt.includes("slot") || lowerPrompt.includes("scheduler")) {
        if (!requiredCapabilities.some(c => c.id === "pickup-scheduler")) {
          requiredCapabilities.push({
            id: "pickup-scheduler",
            name: "Fresh Bake Pickup Scheduler",
            evidenceVocabulary: ["pickup", "slot", "time", "date", "fresh", "reserve", "schedule"],
            controlsRequired: ["input", "button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Bread subscription
      if (lowerPrompt.includes("subscription") || lowerPrompt.includes("recurring") || lowerPrompt.includes("bread club")) {
        if (!requiredCapabilities.some(c => c.id === "bread-subscription")) {
          requiredCapabilities.push({
            id: "bread-subscription",
            name: "Recurring Bread Club Subscription",
            evidenceVocabulary: ["subscription", "weekly", "loaf", "recurring", "club", "box"],
            controlsRequired: ["button", "select"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Promotional Hero Carousel (only if requested)
      if (lowerPrompt.includes("carousel") || lowerPrompt.includes("banner") || lowerPrompt.includes("promotional")) {
        if (!requiredCapabilities.some(c => c.id === "hero-carousel")) {
          requiredCapabilities.push({
            id: "hero-carousel",
            name: "Promotional Hero Carousel",
            evidenceVocabulary: ["carousel", "banner", "slide", "promotional", "hero"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Lightning Deals / Flash Sales (only if requested)
      if (lowerPrompt.includes("deal") || lowerPrompt.includes("lightning") || lowerPrompt.includes("countdown") || lowerPrompt.includes("timer") || lowerPrompt.includes("flash sale")) {
        if (!requiredCapabilities.some(c => c.id === "lightning-deals")) {
          requiredCapabilities.push({
            id: "lightning-deals",
            name: "Lightning Deal Countdown Timer",
            evidenceVocabulary: ["deal", "countdown", "timer", "limited", "flash"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Pincode / Delivery availability (only if requested)
      if (lowerPrompt.includes("pincode") || lowerPrompt.includes("zip code") || lowerPrompt.includes("delivery checker") || lowerPrompt.includes("serviceable")) {
        if (!requiredCapabilities.some(c => c.id === "pincode-checker")) {
          requiredCapabilities.push({
            id: "pincode-checker",
            name: "Delivery Pincode Availability Checker",
            evidenceVocabulary: ["pincode", "delivery", "availability", "check", "serviceable"],
            controlsRequired: ["input", "button"],
            testInteraction: { controlType: "input", action: "input" },
          });
        }
      }
    }

    // ── HOSPITALITY: Discovery-driven resort portal capabilities ──────────────
    if (experiencePattern === "hospitality-portal") {
      if (!requiredCapabilities.some(c => c.id === "suite-showcase" || c.id === "villa-booking" || c.id === "accommodations")) {
        requiredCapabilities.push({
          id: "suite-showcase",
          name: "Curated Suites & Villas Showcase",
          evidenceVocabulary: ["suite", "villa", "room", "stay", "bedroom", "night", "amenities", "photography", "floorplan"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      if (lowerPrompt.includes("booking") || lowerPrompt.includes("availability") || lowerPrompt.includes("reservation") || lowerPrompt.includes("check")) {
        if (!requiredCapabilities.some(c => c.id === "interactive-booking" || c.id === "room-availability")) {
          requiredCapabilities.push({
            id: "interactive-booking",
            name: "Interactive Room Availability & Booking Engine",
            evidenceVocabulary: ["check-in", "check-out", "availability", "reserve", "dates", "guests", "booking", "rates"],
            controlsRequired: ["button", "input"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("stay planner") || lowerPrompt.includes("itinerary") || lowerPrompt.includes("personalized stay") || lowerPrompt.includes("planner")) {
        if (!requiredCapabilities.some(c => c.id === "stay-planner")) {
          requiredCapabilities.push({
            id: "stay-planner",
            name: "Personalized Stay Planner & Itinerary Concierge",
            evidenceVocabulary: ["itinerary", "stay", "planner", "day", "schedule", "dining", "spa", "excursions", "concierge"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("preference") || lowerPrompt.includes("curation") || lowerPrompt.includes("in-suite")) {
        if (!requiredCapabilities.some(c => c.id === "guest-preferences")) {
          requiredCapabilities.push({
            id: "guest-preferences",
            name: "Bespoke Guest Preferences & In-Suite Curation",
            evidenceVocabulary: ["preference", "pillow", "dietary", "temperature", "in-suite", "beverage", "lighting", "fragrance"],
            controlsRequired: ["button", "input"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("dining") || lowerPrompt.includes("restaurant") || lowerPrompt.includes("culinary")) {
        if (!requiredCapabilities.some(c => c.id === "culinary-showcase" || c.id === "dining")) {
          requiredCapabilities.push({
            id: "culinary-showcase",
            name: "Curated Dining & Fine Gastronomy Showcase",
            evidenceVocabulary: ["dining", "restaurant", "culinary", "chef", "menu", "gastronomy", "reserve", "table", "sommelier"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("spa") || lowerPrompt.includes("amenities") || lowerPrompt.includes("wellness")) {
        if (!requiredCapabilities.some(c => c.id === "amenities-spa")) {
          requiredCapabilities.push({
            id: "amenities-spa",
            name: "Property Amenities, Wellness Sanctuary & Thermal Spa",
            evidenceVocabulary: ["spa", "amenity", "wellness", "thermal", "pool", "treatment", "sanctuary", "massage"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("local experience") || lowerPrompt.includes("excursion") || lowerPrompt.includes("activities") || lowerPrompt.includes("experiences")) {
        if (!requiredCapabilities.some(c => c.id === "local-experiences")) {
          requiredCapabilities.push({
            id: "local-experiences",
            name: "Curated Local Experiences & Destination Concierge",
            evidenceVocabulary: ["experience", "local", "excursion", "charter", "tour", "guide", "activity", "destination"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      if (lowerPrompt.includes("concierge") || lowerPrompt.includes("chat")) {
        if (!requiredCapabilities.some(c => c.id === "concierge-chat")) {
          requiredCapabilities.push({
            id: "concierge-chat",
            name: "Virtual Concierge Chat & Instant Guest Services",
            evidenceVocabulary: ["concierge", "chat", "assistant", "message", "request", "guest service", "inquiry"],
            controlsRequired: ["input", "button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }
    }

    // Fallback: If no specialized capabilities matched from custom patterns, derive from brief/specification features
    if (requiredCapabilities.length === 0) {
      // Strictly exclude auth / infrastructure plumbing from domain UI completeness verification
      const featureList = (brief.featurePriority?.features || []).filter(
        (feat: any) => !["auth", "authentication", "login", "signup", "register", "session", "user", "profile"].includes(feat.name.toLowerCase())
      );
      const META_STOPWORDS = new Set([
        "user", "users", "wants", "want", "need", "needs", "manage", "interact",
        "with", "from", "that", "this", "able", "allow", "allows", "system",
        "page", "view", "data", "item", "items", "help", "helps"
      ]);
      for (const feat of featureList.slice(0, 4)) {
        const id = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const baseName = feat.name.toLowerCase();
        // Extract domain vocabulary purely from the feature's name and terms — NEVER from boilerplate sentence templates
        const nameTokens = baseName
          .split(/[\s-_/]+/)
          .map((w: string) => w.replace(/[^a-z0-9]/g, ""))
          .filter((w: string) => w.length > 2 && !META_STOPWORDS.has(w));

        // Handle compound words like "floorplan", "audioguide", etc.
        const compoundSplits: Record<string, string[]> = {
          floorplan: ["floor", "plan", "floor plan"],
          audioguide: ["audio", "guide", "audio guide"],
          soundscape: ["sound", "scape", "soundscape"],
          artwork: ["art", "work", "artwork"],
          artworks: ["art", "works", "artworks"],
        };
        const extraTokens = compoundSplits[baseName] || [];

        // Add singular/plural variants for all tokens
        const variants: string[] = [];
        for (const token of [baseName, ...nameTokens, ...extraTokens]) {
          variants.push(token);
          if (token.endsWith("ies")) variants.push(token.slice(0, -3) + "y");
          else if (token.endsWith("es")) variants.push(token.slice(0, -2));
          else if (token.endsWith("s")) variants.push(token.slice(0, -1));
          else variants.push(token + "s");
        }

        // Include associated entities from domainContract
        for (const ent of ((feat as any).entities || [])) {
          const eLower = String(ent).toLowerCase();
          if (eLower.length > 2 && !META_STOPWORDS.has(eLower)) {
            variants.push(eLower);
            if (eLower.endsWith("s")) variants.push(eLower.slice(0, -1));
            else variants.push(eLower + "s");
          }
        }

        const vocab = Array.from(new Set(variants));
        requiredCapabilities.push({
          id,
          name: feat.name,
          evidenceVocabulary: vocab,
          controlsRequired: ["button", "input"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }
    }

    // Forbidden vocabulary: combine brief forbidden words and domain-isolation negatives
    const forbiddenVocabulary = [
      ...(brief.vocabularyContract?.forbidden || []),
    ];

    // Check for foreign domain artifacts & forbidden substitutions
    const forbiddenArtifacts = [
      "resumeUpload", "KeywordCloud", "MatchDashboard", "scan.service", "keyword.service",
      ...(domainContract?.forbiddenArtifacts || []),
      ...(experienceCapability.forbiddenSubstitutions || []),
    ];

    const contractRoutes = domainContract?.requiredRoutes || [];
    const rawRouteList = contractRoutes.length > 0
      ? contractRoutes
      : (brief.featurePriority?.informationArchitecture?.pages?.map(p => p.route) || []);
    const normalizedRoutes = rawRouteList
      .map((r: string) => r.startsWith("/") ? r : "/" + r)
      .filter((r: string) => r !== "/index" && r !== "/home");
    const expectedRoutes = Array.from(new Set(["/", ...normalizedRoutes]));

    const primaryLandingFeature =
      experienceCapability.real3dRequired
        ? "Interactive 3D Universe World Stage"
        : (domainContract?.primaryLandingFeature ||
           brief.featurePriority?.primaryLandingFeature ||
           brief.featurePriority?.core?.[0]?.name ||
           brief.featurePriority?.informationArchitecture?.pages?.[0]?.name ||
           requiredCapabilities[0]?.name ||
           "Home");

    const compositionGraph = ExperienceArchitect.architect(
      rawPrompt,
      brief.productCharacteristics,
      experienceCapability,
      domainContract,
      brief.seed
    );

    const plannedPages = expectedRoutes.map(route => {
      const match = (brief.featurePriority?.informationArchitecture?.pages || []).find(p => p.route === route);
      let title = match?.name;
      if (!title) {
        if (route === "/") {
          title = "Home";
        } else {
          const rawSlug = route.replace(/^\//, "").replace(/[-_]+/g, " ");
          title = rawSlug.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
      }
      return {
        path: route,
        title: title || "Page",
        category: (match as any)?.category,
      };
    });

    const brandFromPrompt = NavigationDesignResolver.extractBrandFromPrompt(rawPrompt);
    const resolvedBrandName =
      brandFromPrompt ||
      domainContract?.brandName ||
      domainContract?.name ||
      (domainContract?.domainName && !domainContract.domainName.includes("...") && domainContract.domainName.length <= 28 ? domainContract.domainName : undefined) ||
      (brief as any).brand?.name ||
      specification?.appName;

    const navigationDesign = NavigationDesignResolver.resolve(
      rawPrompt,
      experiencePattern,
      resolvedBrandName,
      domainContract?.tagline || (brief as any).brand?.tagline,
      plannedPages,
      brief.productCharacteristics?.emotionalTone?.primary,
      brief.seed,
      compositionGraph.compositionStrategy,
      expectedRoutes
    );

    const experienceIdentity = WebsiteExperienceIdentityResolver.resolve(
      rawPrompt,
      brief.productCharacteristics,
      experienceCapability,
      navigationDesign,
      brief,
      domainContract
    );

    const pagePlans = PageExperiencePlanner.planPages(
      rawPrompt,
      brief.productCharacteristics,
      experienceIdentity,
      experienceCapability,
      expectedRoutes,
      plannedPages
    );

    return {
      planId: `plan_${Date.now()}`,
      generationSeed: brief.seed,
      compositionStrategy: compositionGraph.compositionStrategy,
      experiencePattern,
      experienceCapability,
      compositionGraph,
      navigationDesign,
      experienceIdentity,
      pagePlans,
      expectedHomeRoute,
      primaryLandingFeature,
      primaryActivity: brief.productCharacteristics.primaryActivity,
      requiredCapabilities,
      forbiddenVocabulary: Array.from(new Set(forbiddenVocabulary)),
      forbiddenArtifacts: Array.from(new Set(forbiddenArtifacts)),
      expectedRoutes,
      authWallAllowed,
    };
  }

  public static save(plan: ProductExperiencePlan, outputDirectory: string): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "product-experience-plan.json"), JSON.stringify(plan, null, 2), "utf8");
    if (plan.experienceIdentity) {
      writeFileSync(
        join(aegisDir, "website-experience-identity.json"),
        JSON.stringify(plan.experienceIdentity, null, 2),
        "utf8"
      );
    }
    if (plan.pagePlans && plan.pagePlans.length > 0) {
      writeFileSync(
        join(aegisDir, "page-experience-plans.json"),
        JSON.stringify(plan.pagePlans, null, 2),
        "utf8"
      );
    }
  }

  public static load(outputDirectory: string): ProductExperiencePlan | null {
    const planPath = join(outputDirectory, ".aegis", "product-experience-plan.json");
    if (!existsSync(planPath)) return null;
    try {
      return JSON.parse(readFileSync(planPath, "utf8"));
    } catch {
      return null;
    }
  }
}
